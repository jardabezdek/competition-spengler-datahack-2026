"""Generate a synthetic tracking export of the final with the public lineups, goals and penalties."""

import csv
import math
import random
from collections import deque
from dataclasses import dataclass
from pathlib import Path

from common import AGGREGATES, EVENTS, PLAYERS, ROOT, SLOTS
from models import (
    BLUE_LINE,
    PERIOD_SECONDS,
    ClearType,
    CrossingDirection,
    CrossingResult,
    DumpResult,
    DumpType,
    EventType,
    PassResult,
    Position,
    PuckState,
    ShotResult,
    StoppageReason,
    Strength,
    Team,
    Zone,
)

SYNTHETIC = ROOT / "data" / "synthetic"
SEED = 2026
START_MS = 1_767_179_400_000
INTERMISSION = 18 * 60
TICK = 0.1
GOAL_LINE = 26
RINK = (29.5, 14.5)
BENCH = 14.4
ACCELERATION = 6
SPEED = {Position.FORWARD: 7.5, Position.DEFENSE: 7, Position.GOALIE: 3}
SCRIPT_SECONDS = 22

TEAMS = {Team.HOME: "U.S. Collegiate Selects", Team.AWAY: "HC Davos"}
GOALS = [
    ("11:15", Team.AWAY, 74, [70]),
    ("13:25", Team.HOME, 21, [22]),
    ("14:49", Team.AWAY, 19, [38]),
    ("23:56", Team.HOME, 18, [23, 21]),
    ("31:03", Team.AWAY, 19, [70]),
    ("33:42", Team.HOME, 9, [18, 13]),
    ("55:21", Team.AWAY, 18, [55]),
    ("56:48", Team.AWAY, 70, [19, 90]),
    ("57:49", Team.AWAY, 44, [6, 18]),
]
PENALTIES = [
    ("11:12", Team.HOME, 18, "Slashing", 1),
    ("15:27", Team.AWAY, 55, "CrossChecking", 1),
    ("39:46", Team.HOME, 19, "HighSticking", 2),
    ("56:48", Team.HOME, None, "Delay", 1),
    ("57:49", Team.HOME, 18, "HighSticking", 1),
]
SPOTS = {
    "Center": (0, 0),
    "HomeTeamZoneTop": (-20, 7),
    "HomeTeamZoneBottom": (-20, -7),
    "AwayTeamZoneTop": (20, 7),
    "AwayTeamZoneBottom": (20, -7),
    "NeutralZoneHomeSideTop": (-5.6, 7),
    "NeutralZoneHomeSideBottom": (-5.6, -7),
    "NeutralZoneAwaySideTop": (5.6, 7),
    "NeutralZoneAwaySideBottom": (5.6, -7),
}
EVENT_COLUMNS = [
    "Period",
    "MatchClock",
    "Timestamp",
    "EventType",
    "TeamStrengthType",
    "TeamStrength",
    "HomeGoalieOnIce",
    "AwayGoalieOnIce",
    "EventPosition",
    "EventStartCoordinate",
    "EventEndCoordinate",
    "EventPrimaryPlayerId",
    "EventPrimaryPlayerName",
    "EventPrimaryTeam",
    "EventSecondaryPlayerId",
    "EventSecondaryPlayerName",
    "EventSecondaryTeam",
    "FaceoffSpot",
    "ShotResult",
    "ShotSpeed",
    "ShotScreeningPlayerIds",
    "ShotXG",
    "GoalAssist1Id",
    "GoalAssist2Id",
    "PassResult",
    "PassSpeed",
    "BluelineCrossingResult",
    "BluelineCrossingDirection",
    "BluelineCrossingAttackerIds",
    "BluelineCrossingDefenderIds",
    "DumpResult",
    "DumpType",
    "DumpAlongTheBoards",
    "ClearType",
    "ClearAlongTheBoards",
    "PuckControlState",
    "PuckControlStartZone",
    "PuckControlEndZone",
    "PuckControlContestingPlayerIds",
    "StoppageOfPlayReason",
    "PenaltyReason",
    "ParticipatingPlayerIds",
    *(
        f"StartPlayer{field}{slot}"
        for field in ("Id", "Name", "Team", "Coordinates", "Velocity", "Direction")
        for slot in SLOTS
    ),
]
AGGREGATE_COLUMNS = [
    "Team",
    "Jersey",
    "LastName",
    "FirstName",
    "+",
    "-",
    "TOI (s)",
    "Shifts",
    "BKS",
    "FOW",
    "No. FO",
]


@dataclass(eq=False)
class Player:
    id: str
    first: str
    last: str
    number: int
    position: Position
    team: Team
    x: float = 0
    y: float = 0
    vx: float = 0
    vy: float = 0
    toi: float = 0
    shifts: int = 0
    plus: int = 0
    minus: int = 0
    blocks: int = 0
    wins: int = 0
    faceoffs: int = 0

    @property
    def label(self) -> str:
        return f"#{self.number} {self.first} {self.last}"


@dataclass
class Flight:
    target: tuple[float, float]
    speed: float
    receiver: Player | None
    landing: str


@dataclass
class Script:
    team: Team
    chain: list[Player]
    second: int
    shot: bool = False


def seconds(time: str) -> int:
    minutes, rest = time.split(":")
    return int(minutes) * 60 + int(rest)


def attack(team: Team) -> int:
    return 1 if team == Team.HOME else -1


def other(team: Team) -> Team:
    return Team.AWAY if team == Team.HOME else Team.HOME


def clamp(value: float, limit: float) -> float:
    return max(-limit, min(limit, value))


def zone(x: float) -> Zone:
    return Zone.HOME if x < -BLUE_LINE else Zone.AWAY if x > BLUE_LINE else Zone.NEUTRAL


def coordinate(point: tuple[float, float]) -> str:
    return f"{point[0]:.1f},{point[1]:.1f}"


def distance(a: tuple[float, float], b: tuple[float, float]) -> float:
    return math.hypot(a[0] - b[0], a[1] - b[1])


def expected_goals(point: tuple[float, float], team: Team) -> float:
    gap = distance(point, (attack(team) * GOAL_LINE, 0))
    angle = math.atan2(abs(point[1]), max(0.5, GOAL_LINE - abs(point[0])))
    return 1 / (1 + math.exp(-(-0.6 - 0.15 * gap - angle)))


class Game:
    def __init__(self, roster: list[Player]):
        self.random = random.Random(SEED)
        self.roster = roster
        self.goalies = {
            team: next(
                p for p in roster if p.team == team and p.position == Position.GOALIE
            )
            for team in Team
        }
        self.queues = {
            team: {
                position: deque(
                    p for p in roster if p.team == team and p.position == position
                )
                for position in (Position.FORWARD, Position.DEFENSE)
            }
            for team in Team
        }
        self.skaters: dict[Team, list[Player]] = {team: [] for team in Team}
        self.boxed: dict[Team, list[list]] = {team: [] for team in Team}
        self.leaving: dict[Team, float] = {}
        self.shift = {team: 0.0 for team in Team}
        self.jitter: dict[Player, tuple[float, float]] = {}
        self.rows: list[dict] = []
        self.period = 1
        self.clock = 0.0
        self.wall = 0.0
        self.puck = (0.0, 0.0)
        self.drift = (0.0, 0.0)
        self.carrier: Player | None = None
        self.toucher: Player | None = None
        self.flight: Flight | None = None
        self.battle: float | None = None
        self.next_action = 0.0
        self.carry_target = (0.0, 0.0)
        self.open_control: dict | None = None
        self.pending: dict | None = None
        self.script: Script | None = None
        self.goals = deque(
            (seconds(time), team, scorer, assists)
            for time, team, scorer, assists in GOALS
        )
        self.penalties = deque(
            (seconds(time), team, number, reason, count)
            for time, team, number, reason, count in PENALTIES
        )

    @property
    def game_time(self) -> float:
        return (self.period - 1) * PERIOD_SECONDS + self.clock

    def player(self, team: Team, number: int) -> Player:
        return next(p for p in self.roster if p.team == team and p.number == number)

    def on_ice(self) -> list[Player]:
        return [
            player
            for team in (Team.AWAY, Team.HOME)
            for player in (self.goalies[team], *self.skaters[team])
        ]

    def owner(self) -> Team | None:
        if self.carrier:
            return self.carrier.team
        if self.flight and self.flight.receiver:
            return self.flight.receiver.team
        return None

    def bench(self, team: Team, box: bool = False) -> tuple[float, float]:
        side = BENCH if self.period != 2 else -BENCH
        x = 0 if box else -attack(team) * self.random.uniform(2, 7)
        return x, -side if box else side

    def strength(self) -> dict:
        home, away = len(self.skaters[Team.HOME]), len(self.skaters[Team.AWAY])
        if home == away:
            kind = Strength.FULL if home == 5 else Strength.EQUAL
        else:
            kind = Strength.HOME_POWERPLAY if home > away else Strength.AWAY_POWERPLAY
        return {
            "TeamStrengthType": kind,
            "TeamStrength": f"{home}v{away}",
            "HomeGoalieOnIce": "TRUE",
            "AwayGoalieOnIce": "TRUE",
        }

    def emit(
        self,
        event_type: EventType,
        point: tuple[float, float] | None = None,
        snapshot: bool = True,
        **fields,
    ) -> dict:
        row = dict.fromkeys(EVENT_COLUMNS, "")
        row.update(
            Period=self.period,
            MatchClock=int(self.clock),
            Timestamp=START_MS + round(self.wall * 1000),
            EventType=event_type,
        )
        if point:
            row.update(
                EventStartCoordinate=coordinate(point), EventPosition=zone(point[0])
            )
        if snapshot:
            row.update(self.strength())
            for slot, p in enumerate(self.on_ice(), 1):
                speed = math.hypot(p.vx, p.vy)
                row[f"StartPlayerId{slot}"] = p.id
                row[f"StartPlayerName{slot}"] = p.label
                row[f"StartPlayerTeam{slot}"] = p.team
                row[f"StartPlayerCoordinates{slot}"] = coordinate((p.x, p.y))
                if speed > 0.05:
                    row[f"StartPlayerVelocity{slot}"] = f"{speed:.3f}"
                    row[f"StartPlayerDirection{slot}"] = (
                        f"{p.vx / speed:.3f},{p.vy / speed:.3f}"
                    )
        row.update(fields)
        self.rows.append(row)
        return row

    @staticmethod
    def who(primary: Player | None, secondary: Player | None = None) -> dict:
        fields = {}
        for role, p in (("Primary", primary), ("Secondary", secondary)):
            if p:
                fields.update(
                    {
                        f"Event{role}PlayerId": p.id,
                        f"Event{role}PlayerName": p.label,
                        f"Event{role}Team": p.team,
                    }
                )
        fields["ParticipatingPlayerIds"] = ",".join(
            p.id for p in (primary, secondary) if p
        )
        return fields

    def close_control(self) -> None:
        if self.open_control:
            self.open_control.update(
                EventEndCoordinate=coordinate(self.puck),
                PuckControlEndZone=zone(self.puck[0]),
            )
            self.open_control = None

    def control(
        self,
        state: PuckState,
        player: Player | None = None,
        contesting: list[Player] = (),
    ) -> None:
        self.close_control()
        fields = self.who(player) if player else {}
        if contesting:
            fields["PuckControlContestingPlayerIds"] = ",".join(
                p.id for p in contesting
            )
        self.open_control = self.emit(
            EventType.PUCK_CONTROL,
            self.puck,
            PuckControlState=state,
            PuckControlStartZone=zone(self.puck[0]),
            **fields,
        )

    def gain(self, player: Player) -> None:
        if self.pending:
            self.pending.update(self.who(self.pending["_by"], player))
            if self.pending["EventType"] == EventType.DUMP:
                same = player.team == self.pending["_by"].team
                self.pending["DumpResult"] = (
                    DumpResult.POSSESSION if same else DumpResult.TURNOVER
                )
            del self.pending["_by"]
            self.pending = None
        self.carrier = self.toucher = player
        self.flight = self.battle = None
        self.control(
            PuckState.HOME if player.team == Team.HOME else PuckState.AWAY, player
        )
        self.next_action = self.clock + self.random.uniform(0.4, 1.2)
        self.carry_target = (
            clamp(player.x + attack(player.team) * 8, 24),
            clamp(player.y + self.random.uniform(-5, 5), 12),
        )

    def release(self, flight: Flight) -> None:
        self.toucher = self.carrier
        self.carrier = None
        self.flight = flight
        self.control(PuckState.LOOSE)

    def change(
        self, team: Team, keep: list[Player] = (), teleport: bool = False
    ) -> None:
        boxed = [entry[0] for entry in self.boxed[team]]
        allowed = max(3, 5 - len(self.boxed[team]))
        chosen = [p for p in keep if p not in boxed]
        for position, count in ((Position.DEFENSE, 2), (Position.FORWARD, allowed - 2)):
            queue = self.queues[team][position]
            needed = count - sum(p.position == position for p in chosen)
            for _ in range(len(queue)):
                if needed <= 0:
                    break
                candidate = queue[0]
                queue.rotate(-1)
                if candidate not in chosen and candidate not in boxed:
                    chosen.append(candidate)
                    needed -= 1
        for p in chosen:
            if p not in self.skaters[team]:
                p.shifts += 1
                if not teleport:
                    p.x, p.y = self.bench(team)
                    p.vx = p.vy = 0
        self.skaters[team] = chosen
        self.shift[team] = self.random.uniform(35, 55)
        self.leaving.pop(team, None)

    def targets(self, team: Team) -> dict[Player, tuple[float, float]]:
        s = attack(team)
        px, py = self.puck
        owner = self.owner()
        goalie = self.goalies[team]
        targets = {goalie: (-s * 25.3, clamp(py * 0.15, 1))}
        loose = owner is None
        chaser = (
            min(self.skaters[team], key=lambda p: distance((p.x, p.y), self.puck))
            if self.skaters[team]
            else None
        )
        forwards = [p for p in self.skaters[team] if p.position == Position.FORWARD]
        defense = [p for p in self.skaters[team] if p.position == Position.DEFENSE]
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
        if team in self.leaving:
            for p in self.skaters[team]:
                if p is not self.carrier:
                    targets[p] = (p.x, BENCH if self.period != 2 else -BENCH)
        return targets

    def move(self, p: Player, target: tuple[float, float]) -> None:
        dx, dy = target[0] - p.x, target[1] - p.y
        gap = math.hypot(dx, dy)
        top = SPEED[p.position] * (0.85 if p is self.carrier else 1)
        want = min(top, gap * 1.5)
        wx, wy = (dx / gap * want, dy / gap * want) if gap > 0.01 else (0, 0)
        ax, ay = wx - p.vx, wy - p.vy
        limit = ACCELERATION * TICK
        if math.hypot(ax, ay) > limit:
            scale = limit / math.hypot(ax, ay)
            ax, ay = ax * scale, ay * scale
        p.vx += ax
        p.vy += ay
        p.x = clamp(p.x + p.vx * TICK, RINK[0])
        p.y = clamp(p.y + p.vy * TICK, RINK[1])

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
        elif self.pending and self.pending["EventType"] == EventType.DUMP:
            result = CrossingResult.PUCK_DUMPED_IN
        else:
            result = CrossingResult.POSSESSION_LOST
        self.emit(
            EventType.BLUELINE_CROSSING,
            (line, self.puck[1]),
            BluelineCrossingResult=result,
            BluelineCrossingDirection=CrossingDirection.TOWARDS_OPPONENT
            if forward
            else CrossingDirection.TOWARDS_HOME,
            **self.who(p),
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

    def zone_spot(self, team: Team) -> str:
        side = "HomeTeamZone" if team == Team.HOME else "AwayTeamZone"
        return side + ("Top" if self.puck[1] >= 0 else "Bottom")

    def pass_puck(
        self, receiver: Player | None = None, result: PassResult | None = None
    ) -> None:
        passer = self.carrier
        s = attack(passer.team)
        mates = [p for p in self.skaters[passer.team] if p is not passer]
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
                self.skaters[other(passer.team)],
                key=lambda p: distance((p.x, p.y), middle),
            )
            target = (catcher.x, catcher.y)
        elif result == PassResult.FAILED:
            catcher = None
            target = (
                clamp(target[0] + self.random.uniform(-5, 5), RINK[0]),
                clamp(target[1] + self.random.uniform(-5, 5), RINK[1]),
            )
        self.emit(
            EventType.PASS,
            self.puck,
            EventEndCoordinate=coordinate(target),
            PassResult=result,
            PassSpeed=f"{speed:.1f}",
            **self.who(passer, catcher),
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
        defenders = self.skaters[other(shooter.team)]
        net = (s * GOAL_LINE, 0)
        screens = [
            p
            for p in self.on_ice()
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
        self.emit(
            EventType.SHOT,
            self.puck,
            ShotResult=result,
            ShotSpeed=f"{self.random.uniform(70, 150):.1f}",
            ShotXG=f"{expected_goals(self.puck, shooter.team):.3f}",
            ShotScreeningPlayerIds=",".join(p.id for p in screens),
            **self.who(shooter, self.goalies[other(shooter.team)]),
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
            goalie = self.goalies[other(shooter.team)]
            self.release(Flight((goalie.x, goalie.y), 25, None, "save"))

    def dump(self, kind: DumpType) -> None:
        s = attack(self.carrier.team)
        target = (s * 24, self.random.choice((-10, 10)))
        self.pending = self.emit(
            EventType.DUMP,
            self.puck,
            EventEndCoordinate=coordinate(target),
            DumpType=kind,
            DumpAlongTheBoards=self.random.choice(("TRUE", "FALSE")),
            **self.who(self.carrier),
        )
        self.pending["_by"] = self.carrier
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
                self.skaters[other(clearer.team)],
                key=lambda p: distance((p.x, p.y), self.puck),
            )
        target = (catcher.x, catcher.y) if catcher else targets[kind]
        self.pending = self.emit(
            EventType.CLEAR,
            self.puck,
            EventEndCoordinate=coordinate(target),
            ClearType=kind,
            ClearAlongTheBoards="FALSE",
            **self.who(clearer),
        )
        self.pending["_by"] = clearer
        self.release(
            Flight(target, 22, catcher, "icing" if kind == ClearType.ICING else "loose")
        )

    def lose(self) -> None:
        angle = self.random.uniform(0, 2 * math.pi)
        self.toucher = self.carrier
        self.carrier = None
        self.drift = (4 * math.cos(angle), 4 * math.sin(angle))
        self.control(PuckState.LOOSE)

    def contest(self, players: list[Player]) -> None:
        self.toucher = self.carrier
        self.carrier = None
        self.drift = (0, 0)
        self.control(PuckState.CONTESTED, contesting=players)
        self.battle = self.clock + self.random.uniform(0.3, 0.8)

    def act(self) -> None:
        p = self.carrier
        pressure = [
            q
            for q in self.skaters[other(p.team)]
            if distance((q.x, q.y), (p.x, p.y)) < 1.8
        ]
        defending = self.script and self.script.team != p.team
        if pressure and (defending or self.random.random() < 0.45):
            self.contest([p, *pressure])
        elif defending:
            self.carry_target = (clamp(p.x + attack(p.team) * 6, 24), p.y)
            self.next_action = self.clock + 0.3
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
        self.next_action = self.clock + self.random.uniform(0.7, 1.8)

    def scripted_act(self) -> None:
        chain = self.script.chain
        shot_time = self.script.second - 1.0
        p = self.carrier
        if p is chain[-1] and self.clock >= shot_time:
            self.shoot(goal=True)
            return
        if p is chain[-1] and shot_time - self.clock < 2.5:
            self.carry_target = (attack(p.team) * 19, clamp(p.y, 4))
            return
        index = chain.index(p) if p in chain else -1
        if p is not chain[-1] and self.clock >= shot_time - 0.9 * (
            len(chain) - 1 - index
        ):
            self.pass_puck(chain[index + 1], PassResult.SUCCESSFUL)
            return
        if p is chain[-1] or self.random.random() < 0.5:
            self.pass_puck(result=PassResult.SUCCESSFUL)
        else:
            self.carry_target = (attack(p.team) * 15, clamp(p.y, 9))
        self.next_action = self.clock + self.random.uniform(0.7, 1.5)

    def resolve_loose(self) -> None:
        if self.carrier or self.flight or (self.script and self.script.shot):
            return
        near = [
            p
            for team in Team
            for p in self.skaters[team]
            if distance((p.x, p.y), self.puck) < 1.3
        ]
        if self.battle is not None:
            if self.clock >= self.battle:
                near = [
                    p
                    for team in Team
                    for p in self.skaters[team]
                    if distance((p.x, p.y), self.puck) < 2.5
                ] or near
                if near:
                    self.gain(self.pick_winner(near))
            return
        if not near:
            return
        if len({p.team for p in near}) == 2 and self.random.random() < 0.6:
            self.control(PuckState.CONTESTED, contesting=near)
            self.battle = self.clock + self.random.uniform(0.3, 0.9)
        else:
            self.gain(self.pick_winner(near))

    def pick_winner(self, near: list[Player]) -> Player:
        if self.script:
            favoured = [p for p in near if p.team == self.script.team]
            near = favoured or near
        return self.random.choice(near)

    def faceoff(self, spot: str) -> None:
        x, y = SPOTS[spot]
        self.puck = (x, y)
        self.carrier = self.flight = self.battle = None
        self.drift = (0, 0)
        centres = {}
        for team in Team:
            s = attack(team)
            forwards = [p for p in self.skaters[team] if p.position == Position.FORWARD]
            defense = [p for p in self.skaters[team] if p.position == Position.DEFENSE]
            places = [(x - s, y), (x - s * 1.5, y + 4), (x - s * 1.5, y - 4)]
            for p, (px, py) in zip(forwards, places):
                p.x, p.y = clamp(px, RINK[0]), clamp(py, RINK[1])
            for p, side in zip(defense, (1, -1)):
                p.x, p.y = clamp(x - s * 8, 24), clamp(y + side * 4, RINK[1])
            for p in (*self.skaters[team], self.goalies[team]):
                p.vx = p.vy = 0
            goalie = self.goalies[team]
            goalie.x, goalie.y = -s * 25.3, 0
            centres[team] = forwards[0] if forwards else self.skaters[team][0]
        winning = self.script.team if self.script else self.random.choice(list(Team))
        winner, loser = centres[winning], centres[other(winning)]
        winner.wins += 1
        for centre in centres.values():
            centre.faceoffs += 1
        self.emit(
            EventType.FACEOFF,
            None,
            EventPosition=zone(x),
            FaceoffSpot=spot,
            **self.who(winner, loser),
        )
        receiver = self.random.choice(
            [p for p in self.skaters[winning] if p is not winner] or [winner]
        )
        self.toucher = winner
        self.release(Flight((receiver.x, receiver.y), 10, receiver, "loose"))

    def stop(self, reason: StoppageReason, spot: str | None) -> None:
        self.close_control()
        self.emit(EventType.STOPPAGE, snapshot=False, StoppageOfPlayReason=reason)
        self.carrier = self.flight = self.battle = None
        self.pending = None
        self.wall += self.random.uniform(20, 45)
        self.call_penalties()
        if spot:
            for team in Team:
                if self.shift[team] < 20 or len(self.skaters[team]) != max(
                    3, 5 - len(self.boxed[team])
                ):
                    self.change(
                        team,
                        self.script.chain
                        if self.script and self.script.team == team
                        else (),
                        True,
                    )
            self.faceoff(spot)

    def call_penalties(self) -> None:
        while self.penalties and self.penalties[0][0] <= self.game_time + 0.5:
            _, team, number, reason, count = self.penalties.popleft()
            offender = self.player(team, number) if number else None
            for _ in range(count):
                self.emit(
                    EventType.PENALTY,
                    snapshot=False,
                    PenaltyReason=reason,
                    **{"EventPrimaryTeam": team, **self.who(offender)},
                )
            self.boxed[team].append([offender, self.game_time + 120 * count])

    def score(self) -> None:
        scorer = self.script.chain[-1]
        team = scorer.team
        _, _, _, assists = self.goals.popleft()
        helpers = [self.player(team, number) for number in assists]
        powerplay = len(self.skaters[team]) > len(self.skaters[other(team)])
        self.close_control()
        self.emit(
            EventType.GOAL,
            snapshot=False,
            **self.strength(),
            GoalAssist1Id=helpers[0].id if helpers else "",
            GoalAssist2Id=helpers[1].id if len(helpers) > 1 else "",
            **{
                **self.who(scorer),
                "ParticipatingPlayerIds": ",".join(p.id for p in (scorer, *helpers)),
            },
        )
        if not powerplay:
            for p in self.skaters[team]:
                p.plus += 1
            for p in self.skaters[other(team)]:
                p.minus += 1
        elif self.boxed[other(team)]:
            entry = min(self.boxed[other(team)], key=lambda item: item[1])
            remaining = entry[1] - self.game_time
            entry[1] = (
                self.game_time + remaining - 120 if remaining > 120 else self.game_time
            )
            self.release_box()
        self.script = None
        self.stop(StoppageReason.GOAL, "Center")

    def release_box(self) -> None:
        for team in Team:
            for entry in [e for e in self.boxed[team] if e[1] <= self.game_time]:
                self.boxed[team].remove(entry)
                back = entry[0] or next(
                    p
                    for p in self.queues[team][Position.FORWARD]
                    if p not in self.skaters[team]
                )
                back.x, back.y = self.bench(team, box=True)
                back.shifts += 1
                self.skaters[team].append(back)

    def follow_plays(self) -> None:
        if (
            self.penalties
            and self.penalties[0][0] <= self.game_time
            and not (self.goals and self.goals[0][0] == self.penalties[0][0])
        ):
            team = self.penalties[0][1]
            self.stop(StoppageReason.PENALTY, self.zone_spot(team))
            return
        if (
            self.goals
            and not self.script
            and self.goals[0][0] - SCRIPT_SECONDS <= self.game_time
        ):
            second, team, number, assists = self.goals[0]
            chain = [self.player(team, n) for n in reversed(assists)] + [
                self.player(team, number)
            ]
            self.script = Script(
                team, chain, second - (self.period - 1) * PERIOD_SECONDS
            )
            self.change(team, chain)
        if self.script:
            if self.script.shot and self.clock >= self.script.second + 0.2:
                self.score()
            elif not self.script.shot and self.clock >= self.script.second - 0.4:
                scorer = self.script.chain[-1]
                self.carrier = self.flight = self.battle = None
                self.puck = (scorer.x, scorer.y)
                self.gain(scorer)
                self.shoot(goal=True)
        self.release_box()

    def tick(self) -> None:
        self.follow_plays()
        if self.carrier and self.clock >= self.next_action:
            self.act()
        if self.random.random() < TICK / 3:
            p = self.random.choice(self.on_ice())
            self.jitter[p] = (self.random.uniform(-2, 2), self.random.uniform(-2, 2))
        for team in Team:
            targets = self.targets(team)
            for p in (self.goalies[team], *self.skaters[team]):
                self.move(p, targets.get(p, (p.x, p.y)))
                p.toi += TICK
        self.move_puck()
        self.resolve_loose()
        self.clock += TICK
        self.wall += TICK
        for team in Team:
            self.shift[team] -= TICK
            locked = self.script and self.script.team == team
            if self.shift[team] <= 0 and team not in self.leaving and not locked:
                self.leaving[team] = self.clock + 2.5
            if team in self.leaving and self.clock >= self.leaving[team] and not locked:
                holding = (self.carrier, self.flight.receiver if self.flight else None)
                self.change(team, [p for p in holding if p and p.team == team])
        if (
            not self.script
            and self.random.random() < TICK / 200
            and (self.carrier or self.flight is None)
        ):
            self.stop(StoppageReason.OTHER, self.random.choice(list(SPOTS)))

    def play(self) -> None:
        for period in range(1, 4):
            self.period = period
            self.clock = 0.0
            if period > 1:
                self.wall += INTERMISSION
            for team in Team:
                self.change(team, teleport=True)
            self.faceoff("Center")
            while self.clock < PERIOD_SECONDS:
                self.tick()
            self.stop(StoppageReason.PERIOD_END, None)


def load_roster(path: Path) -> list[Player]:
    with path.open() as file:
        return [
            Player(
                id=row["player_id"],
                first=row["first_name"],
                last=row["last_name"],
                number=int(row["number"]),
                position=Position(row["position"]),
                team=next(
                    team for team, name in TEAMS.items() if name == row["team_name"]
                ),
            )
            for row in csv.DictReader(file)
        ]


def write(path: Path, columns: list[str], rows: list[dict]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", newline="") as file:
        writer = csv.DictWriter(
            file, fieldnames=columns, extrasaction="ignore", lineterminator="\n"
        )
        writer.writeheader()
        writer.writerows(rows)
    print(f"Wrote {len(rows)} rows to {path.relative_to(ROOT)}")


def main() -> None:
    game = Game(load_roster(SYNTHETIC / "reference" / PLAYERS.name))
    game.play()
    write(SYNTHETIC / "raw" / EVENTS.name, EVENT_COLUMNS, game.rows)
    skaters = [p for p in game.roster if p.position != Position.GOALIE]
    write(
        SYNTHETIC / "raw" / AGGREGATES.name,
        AGGREGATE_COLUMNS,
        [
            {
                "Team": TEAMS[p.team],
                "Jersey": p.number,
                "LastName": p.last,
                "FirstName": p.first,
                "+": p.plus,
                "-": p.minus,
                "TOI (s)": round(p.toi),
                "Shifts": p.shifts,
                "BKS": p.blocks,
                "FOW": p.wins,
                "No. FO": p.faceoffs,
            }
            for p in skaters
        ],
    )


if __name__ == "__main__":
    main()
