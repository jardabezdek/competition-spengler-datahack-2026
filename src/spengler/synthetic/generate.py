"""Generate a synthetic tracking export of the final with the public lineups, goals and penalties."""

import csv
from pathlib import Path

from spengler.models import Position
from spengler.paths import AGGREGATES, EVENTS, PLAYERS, ROOT, SYNTHETIC
from spengler.synthetic.entities import Player
from spengler.synthetic.events import EVENT_COLUMNS
from spengler.synthetic.game import Game
from spengler.synthetic.scenario import TEAMS

AGGREGATE_COLUMNS = [
    "Team",
    "Jersey",
    "LastName",
    "FirstName",
    "+",
    "-",
    "TOI (s)",
    "Shifts",
    "BKS",
    "FOW",
    "No. FO",
]


def load_roster(path: Path) -> list[Player]:
    with path.open() as file:
        return [
            Player(
                id=row["player_id"],
                first=row["first_name"],
                last=row["last_name"],
                number=int(row["number"]),
                position=Position(row["position"]),
                team=next(
                    team for team, name in TEAMS.items() if name == row["team_name"]
                ),
            )
            for row in csv.DictReader(file)
        ]


def write(path: Path, columns: list[str], rows: list[dict]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", newline="") as file:
        writer = csv.DictWriter(
            file, fieldnames=columns, extrasaction="ignore", lineterminator="\n"
        )
        writer.writeheader()
        writer.writerows(rows)
    print(f"Wrote {len(rows)} rows to {path.relative_to(ROOT)}")


def main() -> None:
    game = Game(load_roster(SYNTHETIC / "reference" / PLAYERS.name))
    game.play()
    write(SYNTHETIC / "raw" / EVENTS.name, EVENT_COLUMNS, game.log.rows)
    skaters = [p for p in game.roster if p.position != Position.GOALIE]
    write(
        SYNTHETIC / "raw" / AGGREGATES.name,
        AGGREGATE_COLUMNS,
        [
            {
                "Team": TEAMS[p.team],
                "Jersey": p.number,
                "LastName": p.last,
                "FirstName": p.first,
                "+": p.plus,
                "-": p.minus,
                "TOI (s)": round(p.toi),
                "Shifts": p.shifts,
                "BKS": p.blocks,
                "FOW": p.wins,
                "No. FO": p.faceoffs,
            }
            for p in skaters
        ],
    )


if __name__ == "__main__":
    main()
