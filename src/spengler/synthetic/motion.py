"""How skaters accelerate towards where they want to be, one tick at a time."""

import math

from spengler.models import Position
from spengler.synthetic.entities import Player
from spengler.synthetic.rink import RINK, clamp

TICK = 0.1
ACCELERATION = 6
SPEED = {Position.FORWARD: 7.5, Position.DEFENSE: 7, Position.GOALIE: 3}


def skate(p: Player, target: tuple[float, float], carrying: bool) -> None:
    dx, dy = target[0] - p.x, target[1] - p.y
    gap = math.hypot(dx, dy)
    top = SPEED[p.position] * (0.85 if carrying else 1)
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
