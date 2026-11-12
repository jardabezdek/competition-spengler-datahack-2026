"""The things the simulation moves around: the clock, players, the puck in flight and a scripted goal."""

from dataclasses import dataclass

from spengler.models import PERIOD_SECONDS, Position, Team


@dataclass
class Clock:
    period: int = 1
    seconds: float = 0.0
    """Match clock within the period."""
    wall: float = 0.0
    """Real seconds since the opening faceoff, stoppages and intermissions included."""

    @property
    def game_time(self) -> float:
        return (self.period - 1) * PERIOD_SECONDS + self.seconds


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
    """A real goal the simulation steers play into: the passing chain ends with the scorer."""

    team: Team
    chain: list[Player]
    second: int
    shot: bool = False
