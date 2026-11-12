"""The public facts of the final that the simulation replays: teams, start time, goals and penalties."""

from collections import deque
from typing import NamedTuple

from spengler.models import Team

START_MS = 1_767_179_400_000
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


class Goal(NamedTuple):
    second: int
    team: Team
    scorer: int
    assists: list[int]


class Penalty(NamedTuple):
    second: int
    team: Team
    number: int | None
    reason: str
    count: int


def seconds(time: str) -> int:
    minutes, rest = time.split(":")
    return int(minutes) * 60 + int(rest)


class Scenario:
    """The goals and penalties still to come, in game seconds."""

    def __init__(self):
        self.goals = deque(
            Goal(seconds(time), team, scorer, assists)
            for time, team, scorer, assists in GOALS
        )
        self.penalties = deque(
            Penalty(seconds(time), team, number, reason, count)
            for time, team, number, reason, count in PENALTIES
        )

    def penalty_stop(self, game_time: float) -> Penalty | None:
        """The penalty that stops play now, unless a goal at the same second stops it first."""
        if not self.penalties or self.penalties[0].second > game_time:
            return None
        if self.goals and self.goals[0].second == self.penalties[0].second:
            return None
        return self.penalties[0]

    def upcoming_goal(self, game_time: float, lead: float) -> Goal | None:
        """The next goal, once it is at most `lead` seconds away."""
        if self.goals and self.goals[0].second - lead <= game_time:
            return self.goals[0]
        return None

    def call_penalties(self, game_time: float) -> list[Penalty]:
        called = []
        while self.penalties and self.penalties[0].second <= game_time + 0.5:
            called.append(self.penalties.popleft())
        return called

    def score_goal(self) -> Goal:
        return self.goals.popleft()
