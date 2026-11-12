"""DuckDB building blocks shared by the processed feeds."""

from pathlib import Path

import duckdb

from spengler.models import (
    ClearType,
    CrossingDirection,
    CrossingResult,
    EventType,
    PassResult,
    PuckState,
    ShotResult,
)
from spengler.paths import ROOT

ON_GOAL = (
    f"EventType = '{EventType.SHOT}' "
    f"AND ShotResult IN ('{ShotResult.SAVED}', '{ShotResult.GOAL}')"
)
CONTROLLED = (
    f"EventType = '{EventType.BLUELINE_CROSSING}' "
    f"AND BluelineCrossingDirection = '{CrossingDirection.TOWARDS_OPPONENT}' "
    f"AND BluelineCrossingResult = '{CrossingResult.POSSESSION_MAINTAINED}'"
)
CONTROL = f"puck_state IN ('{PuckState.HOME}', '{PuckState.AWAY}')"
GIVEAWAY = (
    f"(EventType = '{EventType.PASS}' AND PassResult = '{PassResult.INTERCEPTED}') "
    f"OR (EventType = '{EventType.CLEAR}' AND ClearType = '{ClearType.INTERCEPTED}')"
)


def write_csv(query: str, destination: Path, params: list[str]) -> None:
    destination.parent.mkdir(parents=True, exist_ok=True)
    duckdb.execute(f"COPY ({query}) TO '{destination}' (HEADER, DELIMITER ',')", params)
    count = duckdb.execute(
        "SELECT count(*) FROM read_csv(?)", [str(destination)]
    ).fetchone()[0]
    print(f"Wrote {count} rows to {destination.relative_to(ROOT)}")
