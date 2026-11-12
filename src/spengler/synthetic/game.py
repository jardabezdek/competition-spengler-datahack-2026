"""The match simulation: skaters chase and move the puck tick by tick, while the scenario steers play into the real goals and penalties."""

import math
import random

from spengler.models import (
    BLUE_LINE,
    PERIOD_SECONDS,
    ClearType,
    CrossingDirection,
    CrossingResult,
    DumpType,
    EventType,
    PassResult,
    Position,
    PuckState,
    ShotResult,
    StoppageReason,
    Team,
)
from spengler.synthetic.entities import Clock, Flight, Player, Script
from spengler.synthetic.events import EventLog, who
from spengler.synthetic.lineups import Lineups
from spengler.synthetic.motion import TICK, skate
from spengler.synthetic.rink import (
    GOAL_LINE,
    RINK,
    SPOTS,
    attack,
    bench_line,
    clamp,
    coordinate,
    distance,
    expected_goals,
    other,
    zone,
)
from spengler.synthetic.scenario import Scenario

SEED = 2026
INTERMISSION = 18 * 60
SCRIPT_SECONDS = 22


class Game:
    def __init__(self, roster: list[Player]):
        self.random = random.Random(SEED)
        self.roster = roster
        self.clock = Clock()
        self.lineups = Lineups(roster, self.clock, self.random)
        self.log = EventLog(self.clock, self.lineups)
        self.scenario = Scenario()
        self.jitter: dict[Player, tuple[float, float]] = {}
        self.puck = (0.0, 0.0)
        self.drift = (0.0, 0.0)
        self.carrier: Player | None = None
        self.toucher: Player | None = None
        self.flight: Flight | None = None
        self.battle: float | None = None
        self.next_action = 0.0
        self.carry_target = (0.0, 0.0)
        self.script: Script | None = None

    def play(self) -> None:
        for period in range(1, 4):
            self.clock.period = period
            self.clock.seconds = 0.0
            if period > 1:
                self.clock.wall += INTERMISSION
            for team in Team:
                self.lineups.change(team, teleport=True)
            self.faceoff("Center")
            while self.clock.seconds < PERIOD_SECONDS:
                self.tick()
            self.stop(StoppageReason.PERIOD_END, None)

    def tick(self) -> None:
        self.follow_scenario()
        if self.carrier and self.clock.seconds >= self.next_action:
            self.act()
        if self.random.random() < TICK / 3:
            p = self.random.choice(self.lineups.on_ice())
            self.jitter[p] = (self.random.uniform(-2, 2), self.random.uniform(-2, 2))
        for team in Team:
            targets = self.targets(team)
            for p in (self.lineups.goalies[team], *self.lineups.skaters[team]):
                skate(p, targets.get(p, (p.x, p.y)), p is self.carrier)
                p.toi += TICK
        self.move_puck()
        self.resolve_loose()
        self.clock.seconds += TICK
        self.clock.wall += TICK
        receiver = self.flight.receiver if self.flight else None
        for team in Team:
            locked = bool(self.script and self.script.team == team)
            holding = [p for p in (self.carrier, receiver) if p and p.team == team]
            self.lineups.advance(team, locked, holding)
        if (
            not self.script
            and self.random.random() < TICK / 200
            and (self.carrier or self.flight is None)
        ):
            self.stop(StoppageReason.OTHER, self.random.choice(list(SPOTS)))

    # Scenario: steer play into the real goals and penalties.

    def follow_scenario(self) -> None:
        penalty = self.scenario.penalty_stop(self.clock.game_time)
        if penalty:
            self.stop(StoppageReason.PENALTY, self.zone_spot(penalty.team))
            return
        goal = self.scenario.upcoming_goal(self.clock.game_time, SCRIPT_SECONDS)
        if goal and not self.script:
            chain = [
                self.lineups.player(goal.team, n) for n in reversed(goal.assists)
            ] + [self.lineups.player(goal.team, goal.scorer)]
            self.script = Script(
                goal.team, chain, goal.second - (self.clock.period - 1) * PERIOD_SECONDS
            )
            self.lineups.change(goal.team, chain)
        if self.script:
            if self.script.shot and self.clock.seconds >= self.script.second + 0.2:
                self.score()
            elif (
                not self.script.shot and self.clock.seconds >= self.script.second - 0.4
            ):
                scorer = self.script.chain[-1]
                self.carrier = self.flight = self.battle = None
                self.puck = (scorer.x, scorer.y)
                self.gain(scorer)
                self.shoot(goal=True)
        self.lineups.release_box()

    def score(self) -> None:
        scorer = self.script.chain[-1]
        team = scorer.team
        goal = self.scenario.score_goal()
        helpers = [self.lineups.player(team, number) for number in goal.assists]
        skaters = self.lineups.skaters
        powerplay = len(skaters[team]) > len(skaters[other(team)])
        self.log.close_control(self.puck)
        self.log.emit(
            EventType.GOAL,
            snapshot=False,
            **self.lineups.strength(),
            GoalAssist1Id=helpers[0].id if helpers else "",
            GoalAssist2Id=helpers[1].id if len(helpers) > 1 else "",
            **{
                **who(scorer),
                "ParticipatingPlayerIds": ",".join(p.id for p in (scorer, *helpers)),
            },
        )
        if not powerplay:
            for p in skaters[team]:
                p.plus += 1
            for p in skaters[other(team)]:
                p.minus += 1
        elif self.lineups.boxed[other(team)]:
            self.lineups.end_minor(other(team))
        self.script = None
        self.stop(StoppageReason.GOAL, "Center")

    def call_penalties(self) -> None:
        for penalty in self.scenario.call_penalties(self.clock.game_time):
            offender = (
                self.lineups.player(penalty.team, penalty.number)
                if penalty.number
                else None
            )
            for _ in range(penalty.count):
                self.log.emit(
                    EventType.PENALTY,
                    snapshot=False,
                    PenaltyReason=penalty.reason,
                    **{"EventPrimaryTeam": penalty.team, **who(offender)},
                )
            self.lineups.send_off(penalty.team, offender, penalty.count)

    # Stoppages and faceoffs.

    def stop(self, reason: StoppageReason, spot: str | None) -> None:
        self.log.close_control(self.puck)
        self.log.emit(EventType.STOPPAGE, snapshot=False, StoppageOfPlayReason=reason)
        self.carrier = self.flight = self.battle = None
        self.log.pending = None
        self.clock.wall += self.random.uniform(20, 45)
        self.call_penalties()
        if spot:
            for team in Team:
                if self.lineups.shift[team] < 20 or len(
                    self.lineups.skaters[team]
                ) != self.lineups.allowed(team):
                    self.lineups.change(
                        team,
                        self.script.chain
                        if self.script and self.script.team == team
                        else (),
                        True,
                    )
            self.faceoff(spot)

    def faceoff(self, spot: str) -> None:
        x, y = SPOTS[spot]
        self.puck = (x, y)
        self.carrier = self.flight = self.battle = None
        self.drift = (0, 0)
        centres = {}
        for team in Team:
            s = attack(team)
            skaters = self.lineups.skaters[team]
            forwards = [p for p in skaters if p.position == Position.FORWARD]
            defense = [p for p in skaters if p.position == Position.DEFENSE]
            places = [(x - s, y), (x - s * 1.5, y + 4), (x - s * 1.5, y - 4)]
            for p, (px, py) in zip(forwards, places):
                p.x, p.y = clamp(px, RINK[0]), clamp(py, RINK[1])
            for p, side in zip(defense, (1, -1)):
                p.x, p.y = clamp(x - s * 8, 24), clamp(y + side * 4, RINK[1])
            goalie = self.lineups.goalies[team]
            for p in (*skaters, goalie):
                p.vx = p.vy = 0
            goalie.x, goalie.y = -s * 25.3, 0
            centres[team] = forwards[0] if forwards else skaters[0]
        winning = self.script.team if self.script else self.random.choice(list(Team))
        winner, loser = centres[winning], centres[other(winning)]
        winner.wins += 1
        for centre in centres.values():
            centre.faceoffs += 1
        self.log.emit(
            EventType.FACEOFF,
            None,
            EventPosition=zone(x),
            FaceoffSpot=spot,
            **who(winner, loser),
        )
        receiver = self.random.choice(
            [p for p in self.lineups.skaters[winning] if p is not winner] or [winner]
        )
        self.toucher = winner
        self.release(Flight((receiver.x, receiver.y), 10, receiver, "loose"))

    def zone_spot(self, team: Team) -> str:
        side = "HomeTeamZone" if team == Team.HOME else "AwayTeamZone"
        return side + ("Top" if self.puck[1] >= 0 else "Bottom")

    # Possession.

    def owner(self) -> Team | None:
        if self.carrier:
            return self.carrier.team
        if self.flight and self.flight.receiver:
            return self.flight.receiver.team
        return None

    def gain(self, player: Player) -> None:
        self.log.receive(player)
        self.carrier = self.toucher = player
        self.flight = self.battle = None
        self.log.control(
            PuckState.HOME if player.team == Team.HOME else PuckState.AWAY,
            self.puck,
            player,
        )
        self.next_action = self.clock.seconds + self.random.uniform(0.4, 1.2)
        self.carry_target = (
            clamp(player.x + attack(player.team) * 8, 24),
            clamp(player.y + self.random.uniform(-5, 5), 12),
        )

    def release(self, flight: Flight) -> None:
        self.toucher = self.carrier
        self.carrier = None
        self.flight = flight
        self.log.control(PuckState.LOOSE, self.puck)

    def lose(self) -> None:
        angle = self.random.uniform(0, 2 * math.pi)
        self.toucher = self.carrier
        self.carrier = None
        self.drift = (4 * math.cos(angle), 4 * math.sin(angle))
        self.log.control(PuckState.LOOSE, self.puck)

    def contest(self, players: list[Player]) -> None:
        self.toucher = self.carrier
        self.carrier = None
        self.drift = (0, 0)
        self.log.control(PuckState.CONTESTED, self.puck, contesting=players)
        self.battle = self.clock.seconds + self.random.uniform(0.3, 0.8)

    def resolve_loose(self) -> None:
        if self.carrier or self.flight or (self.script and self.script.shot):
            return
        near = self.near_puck(1.3)
        if self.battle is not None:
            if self.clock.seconds >= self.battle:
                near = self.near_puck(2.5) or near
                if near:
                    self.gain(self.pick_winner(near))
            return
        if not near:
            return
        if len({p.team for p in near}) == 2 and self.random.random() < 0.6:
            self.log.control(PuckState.CONTESTED, self.puck, contesting=near)
            self.battle = self.clock.seconds + self.random.uniform(0.3, 0.9)
        else:
            self.gain(self.pick_winner(near))

    def near_puck(self, reach: float) -> list[Player]:
        return [
            p
            for team in Team
            for p in self.lineups.skaters[team]
            if distance((p.x, p.y), self.puck) < reach
        ]

    def pick_winner(self, near: list[Player]) -> Player:
        if self.script:
            favoured = [p for p in near if p.team == self.script.team]
            near = favoured or near
        return self.random.choice(near)

    # Decisions of the puck carrier.

    def act(self) -> None:
        p = self.carrier
        pressure = [
            q
            for q in self.lineups.skaters[other(p.team)]
            if distance((q.x, q.y), (p.x, p.y)) < 1.8
        ]
        defending = self.script and self.script.team != p.team
        if pressure and (defending or self.random.random() < 0.45):
            self.contest([p, *pressure])
        elif defending:
            self.carry_target = (clamp(p.x + attack(p.team) * 6, 24), p.y)
            self.next_action = self.clock.seconds + 0.3
        elif self.script:
            self.scripted_act()
        else:
            self.play_on(p)

    def play_on(self, p: Player) -> None:
        s = attack(p.team)
        depth = s * p.x
        roll = self.random.random()
        if depth > BLUE_LINE:
            if roll < 0.12:
                self.shoot()
            elif roll < 0.72:
                self.pass_puck()
            elif roll < 0.9:
                self.carry_target = (
                    s * self.random.uniform(14, 24),
                    self.random.uniform(-9, 9),
                )
            else:
                self.lose()
        elif depth > -BLUE_LINE:
            if roll < 0.45:
                self.carry_target = (
                    s * self.random.uniform(11, 17),
                    clamp(p.y + self.random.uniform(-6, 6), 12),
                )
            elif roll < 0.68:
                self.dump(DumpType.DUMP_IN)
            else:
                self.pass_puck()
        elif roll < 0.55:
            self.pass_puck()
        elif roll < 0.93:
            self.carry_target = (
                p.x + s * 10,
                clamp(p.y + self.random.uniform(-6, 6), 12),
            )
        elif roll < 0.97:
            self.clear()
        else:
            self.dump(DumpType.DUMP_OUT)
        self.next_action = self.clock.seconds + self.random.uniform(0.7, 1.8)

    def scripted_act(self) -> None:
        chain = self.script.chain
        shot_time = self.script.second - 1.0
        p = self.carrier
        if p is chain[-1] and self.clock.seconds >= shot_time:
            self.shoot(goal=True)
            return
        if p is chain[-1] and shot_time - self.clock.seconds < 2.5:
            self.carry_target = (attack(p.team) * 19, clamp(p.y, 4))
            return
        index = chain.index(p) if p in chain else -1
        if p is not chain[-1] and self.clock.seconds >= shot_time - 0.9 * (
            len(chain) - 1 - index
        ):
            self.pass_puck(chain[index + 1], PassResult.SUCCESSFUL)
            return
        if p is chain[-1] or self.random.random() < 0.5:
            self.pass_puck(result=PassResult.SUCCESSFUL)
        else:
            self.carry_target = (attack(p.team) * 15, clamp(p.y, 9))
        self.next_action = self.clock.seconds + self.random.uniform(0.7, 1.5)

    # Puck plays.

    def pass_puck(
        self, receiver: Player | None = None, result: PassResult | None = None
    ) -> None:
        passer = self.carrier
        s = attack(passer.team)
        mates = [p for p in self.lineups.skaters[passer.team] if p is not passer]
        receiver = (
            receiver
            or self.random.choices(
                mates, [1 + max(0, s * (p.x - passer.x)) / 5 for p in mates]
            )[0]
        )
        if result is None:
            scripted = self.script and self.script.team == passer.team
            result = (
                PassResult.SUCCESSFUL
                if scripted
                else self.random.choices(list(PassResult), [0.75, 0.1, 0.15])[0]
            )
        speed = self.random.uniform(12, 20)
        lead = distance(self.puck, (receiver.x, receiver.y)) / speed
        target = (
            clamp(receiver.x + receiver.vx * lead, RINK[0]),
            clamp(receiver.y + receiver.vy * lead, RINK[1]),
        )
        catcher = receiver
        if result == PassResult.INTERCEPTED:
            middle = ((self.puck[0] + target[0]) / 2, (self.puck[1] + target[1]) / 2)
            catcher = min(
                self.lineups.skaters[other(passer.team)],
                key=lambda p: distance((p.x, p.y), middle),
            )
            target = (catcher.x, catcher.y)
        elif result == PassResult.FAILED:
            catcher = None
            target = (
                clamp(target[0] + self.random.uniform(-5, 5), RINK[0]),
                clamp(target[1] + self.random.uniform(-5, 5), RINK[1]),
            )
        self.log.emit(
            EventType.PASS,
            self.puck,
            EventEndCoordinate=coordinate(target),
            PassResult=result,
            PassSpeed=f"{speed:.1f}",
            **who(passer, catcher),
        )
        self.release(Flight(target, speed, catcher, "loose"))

    def shoot(self, goal: bool = False) -> None:
        shooter = self.carrier
        s = attack(shooter.team)
        result = (
            ShotResult.GOAL
            if goal
            else self.random.choices(
                [ShotResult.BLOCKED, ShotResult.MISSED, ShotResult.SAVED],
                [0.25, 0.25, 0.5],
            )[0]
        )
        defenders = self.lineups.skaters[other(shooter.team)]
        goalie = self.lineups.goalies[other(shooter.team)]
        net = (s * GOAL_LINE, 0)
        screens = [
            p
            for p in self.lineups.on_ice()
            if p is not shooter
            and p.position != Position.GOALIE
            and distance((p.x, p.y), net) < 8
            and abs(
                (net[0] - self.puck[0]) * (self.puck[1] - p.y)
                - (self.puck[0] - p.x) * (net[1] - self.puck[1])
            )
            / max(distance(self.puck, net), 0.1)
            < 1.2
        ]
        self.log.emit(
            EventType.SHOT,
            self.puck,
            ShotResult=result,
            ShotSpeed=f"{self.random.uniform(70, 150):.1f}",
            ShotXG=f"{expected_goals(self.puck, shooter.team):.3f}",
            ShotScreeningPlayerIds=",".join(p.id for p in screens),
            **who(shooter, goalie),
        )
        if result == ShotResult.GOAL:
            self.script.shot = True
            self.release(
                Flight((s * 26.6, self.random.uniform(-0.6, 0.6)), 25, None, "goal")
            )
        elif result == ShotResult.BLOCKED:
            blocker = min(defenders, key=lambda p: distance((p.x, p.y), self.puck))
            blocker.blocks += 1
            self.release(Flight((blocker.x, blocker.y), 20, None, "loose"))
        elif result == ShotResult.MISSED:
            self.release(
                Flight((s * 28.5, self.random.uniform(-6, 6)), 25, None, "loose")
            )
        else:
            self.release(Flight((goalie.x, goalie.y), 25, None, "save"))

    def dump(self, kind: DumpType) -> None:
        s = attack(self.carrier.team)
        target = (s * 24, self.random.choice((-10, 10)))
        row = self.log.emit(
            EventType.DUMP,
            self.puck,
            EventEndCoordinate=coordinate(target),
            DumpType=kind,
            DumpAlongTheBoards=self.random.choice(("TRUE", "FALSE")),
            **who(self.carrier),
        )
        self.log.await_receiver(row, self.carrier)
        self.release(Flight(target, 18, None, "loose"))

    def clear(self) -> None:
        clearer = self.carrier
        s = attack(clearer.team)
        kind = self.random.choices(list(ClearType), [0.4, 0.3, 0.2, 0.1])[0]
        targets = {
            ClearType.OFFENSIVE_ZONE: (s * 22, self.random.uniform(-8, 8)),
            ClearType.NEUTRAL_ZONE: (s * 2, self.random.uniform(-10, 10)),
            ClearType.ICING: (s * 28.5, self.random.uniform(-6, 6)),
        }
        catcher = None
        if kind == ClearType.INTERCEPTED:
            catcher = min(
                self.lineups.skaters[other(clearer.team)],
                key=lambda p: distance((p.x, p.y), self.puck),
            )
        target = (catcher.x, catcher.y) if catcher else targets[kind]
        row = self.log.emit(
            EventType.CLEAR,
            self.puck,
            EventEndCoordinate=coordinate(target),
            ClearType=kind,
            ClearAlongTheBoards="FALSE",
            **who(clearer),
        )
        self.log.await_receiver(row, clearer)
        self.release(
            Flight(target, 22, catcher, "icing" if kind == ClearType.ICING else "loose")
        )

    # Movement of the skaters and the puck.

    def targets(self, team: Team) -> dict[Player, tuple[float, float]]:
        s = attack(team)
        px, py = self.puck
        owner = self.owner()
        skaters = self.lineups.skaters[team]
        targets = {self.lineups.goalies[team]: (-s * 25.3, clamp(py * 0.15, 1))}
        loose = owner is None
        chaser = (
            min(skaters, key=lambda p: distance((p.x, p.y), self.puck))
            if skaters
            else None
        )
        forwards = [p for p in skaters if p.position == Position.FORWARD]
        defense = [p for p in skaters if p.position == Position.DEFENSE]
        if owner == team:
            if s * px > BLUE_LINE:
                spots = (
                    [(s * 21, 7), (s * 21, -7), (s * 23, 0)],
                    [(s * 9, 9), (s * 9, -9)],
                )
            else:
                spots = (
                    [(px + s * 7, 9), (px + s * 7, -9), (px + s * 4, 0)],
                    [(px - s * 6, 6), (px - s * 6, -6)],
                )
        elif s * px < -BLUE_LINE:
            spots = (
                [(px - s * 1.2, py), ((px - s * 26) / 2, 6), ((px - s * 26) / 2, -6)],
                [(-s * 22, 3.5), (-s * 22, -3.5)],
            )
        else:
            spots = (
                [(px - s * 1.5, py), (px - s * 5, 8), (px - s * 5, -8)],
                [(px - s * 10, 5), (px - s * 10, -5)],
            )
        for group, places in zip((forwards, defense), spots):
            for p, (x, y) in zip(group, places):
                dx, dy = self.jitter.get(p, (0, 0))
                targets[p] = (x + dx, y + dy)
        if chaser and (
            loose or (self.script and self.script.team == team and owner != team)
        ):
            targets[chaser] = self.puck
        if self.script and self.script.team == team:
            scorer = self.script.chain[-1]
            targets[scorer] = (s * 19, 3 if scorer.y >= 0 else -3)
        if self.carrier and self.carrier.team == team:
            targets[self.carrier] = self.carry_target
        if team in self.lineups.leaving:
            for p in skaters:
                if p is not self.carrier:
                    targets[p] = (p.x, bench_line(self.clock.period))
        return targets

    def move_puck(self) -> None:
        before = self.puck
        if self.carrier:
            p = self.carrier
            speed = math.hypot(p.vx, p.vy)
            ux, uy = (
                (p.vx / speed, p.vy / speed) if speed > 0.5 else (attack(p.team), 0)
            )
            self.puck = (clamp(p.x + 0.6 * ux, RINK[0]), clamp(p.y + 0.6 * uy, RINK[1]))
        elif self.flight:
            gap = distance(self.puck, self.flight.target)
            step = self.flight.speed * TICK
            if gap <= step:
                self.puck = self.flight.target
                self.land()
            else:
                tx, ty = self.flight.target
                self.puck = (
                    self.puck[0] + (tx - self.puck[0]) * step / gap,
                    self.puck[1] + (ty - self.puck[1]) * step / gap,
                )
        else:
            x, y = (
                self.puck[0] + self.drift[0] * TICK,
                self.puck[1] + self.drift[1] * TICK,
            )
            self.drift = (
                self.drift[0] * 0.96 * (-1 if abs(x) > RINK[0] else 1),
                self.drift[1] * 0.96 * (-1 if abs(y) > RINK[1] else 1),
            )
            self.puck = (clamp(x, RINK[0]), clamp(y, RINK[1]))
        for line in (-BLUE_LINE, BLUE_LINE):
            if (before[0] - line) * (self.puck[0] - line) < 0 and distance(
                before, self.puck
            ) < 5:
                self.crossing(line, self.puck[0] - before[0])

    def crossing(self, line: float, moved: float) -> None:
        p = self.carrier or self.toucher
        if not p:
            return
        forward = (moved > 0) == (p.team == Team.HOME)
        if not forward:
            result = CrossingResult.NONE
        elif self.carrier:
            result = CrossingResult.POSSESSION_MAINTAINED
        elif self.log.dumped():
            result = CrossingResult.PUCK_DUMPED_IN
        else:
            result = CrossingResult.POSSESSION_LOST
        self.log.emit(
            EventType.BLUELINE_CROSSING,
            (line, self.puck[1]),
            BluelineCrossingResult=result,
            BluelineCrossingDirection=CrossingDirection.TOWARDS_OPPONENT
            if forward
            else CrossingDirection.TOWARDS_HOME,
            **who(p),
        )

    def land(self) -> None:
        flight = self.flight
        self.flight = None
        if flight.receiver:
            self.gain(flight.receiver)
        elif flight.landing == "goal":
            self.drift = (0, 0)
        elif flight.landing == "save":
            team = other(self.toucher.team)
            if self.random.random() < 0.3:
                self.stop(StoppageReason.FREEZE, self.zone_spot(team))
            else:
                self.drift = (
                    attack(team) * self.random.uniform(3, 6),
                    self.random.uniform(-4, 4),
                )
        elif flight.landing == "icing":
            self.stop(StoppageReason.ICING, self.zone_spot(self.toucher.team))
        else:
            self.drift = (self.random.uniform(-2, 2), self.random.uniform(-2, 2))
