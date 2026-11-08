from pathlib import Path

import duckdb

ROOT = Path(__file__).resolve().parent.parent
EVENTS = ROOT / "data" / "raw" / "20251231_uscs_hcd_events_all.csv"


def game_id(path: Path) -> str:
    return path.stem.split("_events", 1)[0]


def write_csv(query: str, destination: Path, params: list[str]) -> None:
    destination.parent.mkdir(parents=True, exist_ok=True)
    duckdb.execute(f"COPY ({query}) TO '{destination}' (HEADER, DELIMITER ',')", params)
    count = duckdb.execute("SELECT count(*) FROM read_csv(?)", [str(destination)]).fetchone()[0]
    print(f"Wrote {count} rows to {destination.relative_to(ROOT)}")
