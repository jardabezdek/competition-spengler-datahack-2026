"""Rink geometry in metres from centre ice; the home team attacks towards positive x."""

import math

from spengler.models import BLUE_LINE, Team, Zone

GOAL_LINE = 26
RINK = (29.5, 14.5)
BENCH = 14.4
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


def attack(team: Team) -> int:
    return 1 if team == Team.HOME else -1


def other(team: Team) -> Team:
    return Team.AWAY if team == Team.HOME else Team.HOME


def bench_line(period: int) -> float:
    """The y of the benches, which appear on the other side in the second period."""
    return BENCH if period != 2 else -BENCH


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
