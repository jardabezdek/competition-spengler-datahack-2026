"""Locations of the raw exports and processed feeds of the selected dataset."""

import os
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
DATA = ROOT / "data" / os.environ.get("DATASET", "synthetic")
SYNTHETIC = ROOT / "data" / "synthetic"
EVENTS = DATA / "raw" / "20251231_uscs_hcd_events_all.csv"
AGGREGATES = DATA / "raw" / "20251231_uscs_hcd_aggregates_all.csv"
PLAYERS = DATA / "reference" / "20251231_uscs_hcd_players.csv"
PROCESSED = DATA / "processed"


def game_id(path: Path) -> str:
    return path.stem.split("_events", 1)[0]
