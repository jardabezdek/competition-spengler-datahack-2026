# competition-spengler-datahack-2026

🏒 Code for Sprengler Datahack Challenge 2026

## The idea

Create a web app comparing the current game detail page with the redesigned one.

The original web page: https://www.spenglercup.ch/en/game/spengler-cup/playoff-final/2025-12-31_us-collegiate-selects_hc-davos


## Data

The app runs on one of two datasets in `data/`, chosen by `DATASET` in a `.env` file at the repository root:

- `synthetic` (default): a simulated tracking export of the same final, with the public lineups, goals and penalties. Committed to the repository, so the public app and repo use it.
- `original`: the confidential tracking data from the organisers. Never committed; keep it in `data/original/` locally and delete it after the challenge.

```sh
cp .env.example .env             # then set DATASET=original to use the confidential data
make generate-synthetic-data     # regenerate data/synthetic/raw/ from the public match facts
make transform                   # build data/$DATASET/processed/ from the raw exports
```

Restart the web app after changing `DATASET`.


## Code

The Python code lives in the `spengler` package under `src/`:

- `spengler/synthetic/`: the match simulation behind `make generate-synthetic-data`.
- `spengler/feeds/`: one module per processed feed, run by `make transform`.
- `spengler/models.py`, `paths.py`, `sql.py`: export values, dataset locations and DuckDB helpers shared by both.
