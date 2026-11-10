from pathlib import Path

import duckdb

from models import (
    ClearType,
    CrossingDirection,
    CrossingResult,
    EventType,
    PassResult,
    ShotResult,
)

ROOT = Path(__file__).resolve().parent.parent
EVENTS = ROOT / "data" / "raw" / "20251231_uscs_hcd_events_all.csv"
AGGREGATES = ROOT / "data" / "raw" / "20251231_uscs_hcd_aggregates_all.csv"
PLAYERS = ROOT / "data" / "reference" / "20251231_uscs_hcd_players.csv"

ON_GOAL = (
    f"EventType = '{EventType.SHOT}' "
    f"AND ShotResult IN ('{ShotResult.SAVED}', '{ShotResult.GOAL}')"
)
CONTROLLED = (
    f"EventType = '{EventType.BLUELINE_CROSSING}' "
    f"AND BluelineCrossingDirection = '{CrossingDirection.TOWARDS_OPPONENT}' "
    f"AND BluelineCrossingResult = '{CrossingResult.POSSESSION_MAINTAINED}'"
)
GIVEAWAY = (
    f"(EventType = '{EventType.PASS}' AND PassResult = '{PassResult.INTERCEPTED}') "
    f"OR (EventType = '{EventType.CLEAR}' AND ClearType = '{ClearType.INTERCEPTED}')"
)


def game_id(path: Path) -> str:
    return path.stem.split("_events", 1)[0]


def write_csv(query: str, destination: Path, params: list[str]) -> None:
    destination.parent.mkdir(parents=True, exist_ok=True)
    duckdb.execute(f"COPY ({query}) TO '{destination}' (HEADER, DELIMITER ',')", params)
    count = duckdb.execute("SELECT count(*) FROM read_csv(?)", [str(destination)]).fetchone()[0]
    print(f"Wrote {count} rows to {destination.relative_to(ROOT)}")
