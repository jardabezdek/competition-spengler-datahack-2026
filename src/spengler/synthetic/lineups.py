"""Who is on the ice, on the bench and in the penalty box, and when the lines change."""

import random
from collections import deque
from dataclasses import dataclass

from spengler.models import Position, Strength, Team
from spengler.synthetic.entities import Clock, Player
from spengler.synthetic.motion import TICK
from spengler.synthetic.rink import attack, bench_line

MINOR_SECONDS = 120


@dataclass(eq=False)
class Sentence:
    """A stay in the penalty box; a bench minor has no player."""

    player: Player | None
    until: float


class Lineups:
    def __init__(self, roster: list[Player], clock: Clock, rng: random.Random):
        self.roster = roster
        self.clock = clock
        self.random = rng
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
        self.boxed: dict[Team, list[Sentence]] = {team: [] for team in Team}
        self.leaving: dict[Team, float] = {}
        self.shift = {team: 0.0 for team in Team}

    def player(self, team: Team, number: int) -> Player:
        return next(p for p in self.roster if p.team == team and p.number == number)

    def on_ice(self) -> list[Player]:
        return [
            player
            for team in (Team.AWAY, Team.HOME)
            for player in (self.goalies[team], *self.skaters[team])
        ]

    def allowed(self, team: Team) -> int:
        return max(3, 5 - len(self.boxed[team]))

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

    def bench(self, team: Team, box: bool = False) -> tuple[float, float]:
        side = bench_line(self.clock.period)
        x = 0 if box else -attack(team) * self.random.uniform(2, 7)
        return x, -side if box else side

    def change(
        self, team: Team, keep: list[Player] = (), teleport: bool = False
    ) -> None:
        boxed = [sentence.player for sentence in self.boxed[team]]
        chosen = [p for p in keep if p not in boxed]
        for position, count in (
            (Position.DEFENSE, 2),
            (Position.FORWARD, self.allowed(team) - 2),
        ):
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

    def advance(self, team: Team, locked: bool, holding: list[Player]) -> None:
        """Count the shift down; a tired line heads to the bench and changes on arrival."""
        self.shift[team] -= TICK
        if self.shift[team] <= 0 and team not in self.leaving and not locked:
            self.leaving[team] = self.clock.seconds + 2.5
        if (
            team in self.leaving
            and self.clock.seconds >= self.leaving[team]
            and not locked
        ):
            self.change(team, holding)

    def send_off(self, team: Team, offender: Player | None, minors: int) -> None:
        self.boxed[team].append(
            Sentence(offender, self.clock.game_time + MINOR_SECONDS * minors)
        )

    def end_minor(self, team: Team) -> None:
        """A power-play goal ends one minor of the team that is short."""
        now = self.clock.game_time
        sentence = min(self.boxed[team], key=lambda item: item.until)
        remaining = sentence.until - now
        sentence.until = (
            now + remaining - MINOR_SECONDS if remaining > MINOR_SECONDS else now
        )
        self.release_box()

    def release_box(self) -> None:
        for team in Team:
            for sentence in [
                s for s in self.boxed[team] if s.until <= self.clock.game_time
            ]:
                self.boxed[team].remove(sentence)
                back = sentence.player or next(
                    p
                    for p in self.queues[team][Position.FORWARD]
                    if p not in self.skaters[team]
                )
                back.x, back.y = self.bench(team, box=True)
                back.shifts += 1
                self.skaters[team].append(back)
