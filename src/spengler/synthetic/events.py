"""Rows of the event export, stamped with the clock and the players on the ice."""

import math

from spengler.models import SLOTS, DumpResult, EventType, PuckState
from spengler.synthetic.entities import Clock, Player
from spengler.synthetic.lineups import Lineups
from spengler.synthetic.rink import coordinate, zone
from spengler.synthetic.scenario import START_MS

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
    fields["ParticipatingPlayerIds"] = ",".join(p.id for p in (primary, secondary) if p)
    return fields


class EventLog:
    def __init__(self, clock: Clock, lineups: Lineups):
        self.clock = clock
        self.lineups = lineups
        self.rows: list[dict] = []
        self.open_control: dict | None = None
        self.pending: tuple[dict, Player] | None = None
        """A dump or clear whose receiver is filled in once someone gains the puck."""

    def emit(
        self,
        event_type: EventType,
        point: tuple[float, float] | None = None,
        snapshot: bool = True,
        **fields,
    ) -> dict:
        row = dict.fromkeys(EVENT_COLUMNS, "")
        row.update(
            Period=self.clock.period,
            MatchClock=int(self.clock.seconds),
            Timestamp=START_MS + round(self.clock.wall * 1000),
            EventType=event_type,
        )
        if point:
            row.update(
                EventStartCoordinate=coordinate(point), EventPosition=zone(point[0])
            )
        if snapshot:
            row.update(self.lineups.strength())
            for slot, p in enumerate(self.lineups.on_ice(), 1):
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

    def close_control(self, puck: tuple[float, float]) -> None:
        if self.open_control:
            self.open_control.update(
                EventEndCoordinate=coordinate(puck),
                PuckControlEndZone=zone(puck[0]),
            )
            self.open_control = None

    def control(
        self,
        state: PuckState,
        puck: tuple[float, float],
        player: Player | None = None,
        contesting: list[Player] = (),
    ) -> None:
        self.close_control(puck)
        fields = who(player) if player else {}
        if contesting:
            fields["PuckControlContestingPlayerIds"] = ",".join(
                p.id for p in contesting
            )
        self.open_control = self.emit(
            EventType.PUCK_CONTROL,
            puck,
            PuckControlState=state,
            PuckControlStartZone=zone(puck[0]),
            **fields,
        )

    def await_receiver(self, row: dict, by: Player) -> None:
        self.pending = (row, by)

    def receive(self, player: Player) -> None:
        if not self.pending:
            return
        row, by = self.pending
        row.update(who(by, player))
        if row["EventType"] == EventType.DUMP:
            row["DumpResult"] = (
                DumpResult.POSSESSION if player.team == by.team else DumpResult.TURNOVER
            )
        self.pending = None

    def dumped(self) -> bool:
        return bool(self.pending) and self.pending[0]["EventType"] == EventType.DUMP
