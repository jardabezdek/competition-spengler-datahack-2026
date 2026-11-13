# competition-spengler-datahack-2026

🏒 Code for the Spengler Cup DataHack Challenge 2026

## The idea

**The problem.** The Spengler Cup website gets over 1.3 million unique visits during the five tournament days. But most visitors check the score and leave. The organisers want them to stay longer.

**Our solution.** No fancy models, just a better page: we redesigned the game detail page so that the tracking data tells the story of the game and invites fans to explore it.

**The demo.** A web app that lets you switch between the current game detail page and our redesign, both showing the 2025 final, US Collegiate Selects vs HC Davos.

## Links

- [SIC DataHack Challenge 2026](https://innovation-thinksport.agorize.com/en/challenges/sic-datahack-challenge-2026)
- [Demo](https://spengler-game-center.vercel.app/)
- [Submission slides](docs/submission_slides.pdf)
- [Original page](https://www.spenglercup.ch/en/game/spengler-cup/playoff-final/2025-12-31_us-collegiate-selects_hc-davos)

## Quick start

Requires [uv](https://docs.astral.sh/uv/) (Python 3.11+) and Node.js 18.18+.

```sh
# 1. Data: choose the dataset (synthetic by default, see Data)
cp .env.example .env

# 2. Python environment
make venv

# 3. Processed data: already committed for synthetic, rerun after changing DATASET or the feeds
make transform

# 4. Web app on http://localhost:3000
cd web
npm install
npm run dev
```

Pages: `/current` is a copy of the current page (`/` redirects there); `/en/redesign` and `/de/redesign` are the redesign.

## Data

The app runs on one of two datasets in `data/`, chosen by `DATASET` in `.env`. Both `make` and the web app read it; restart the web app after changing it.

- `synthetic` (default): a simulated tracking export of the same final, with the public lineups, goals and penalties. Committed to the repository, so the demo uses it. `make generate-synthetic-data` regenerates its raw exports and always writes to `data/synthetic/`.
- `original`: the confidential tracking data from the organisers. Never committed; keep it locally and delete it after the challenge. `make transform` expects:
  ```
  data/original/raw/20251231_uscs_hcd_events_all.csv
  data/original/raw/20251231_uscs_hcd_aggregates_all.csv
  data/original/reference/20251231_uscs_hcd_players.csv   # hand-made roster, see the data dictionary
  ```

The processed feeds are described in [docs/data_dictionary.md](docs/data_dictionary.md).

## Code

- `src/spengler/`: the Python package.
  - `synthetic/`: the match simulation behind `make generate-synthetic-data`.
  - `feeds/`: one module per processed feed, run by `make transform`.
  - `models.py`, `paths.py`, `sql.py`: export values, dataset locations and DuckDB helpers shared by both.
- `web/`: the Next.js app.
  - `app/(current)/` and `app/[lang]/redesign/`: the two pages; `app/[lang]/dictionaries/` holds the English and German texts.
  - `components/current/` and `components/redesign/`: their components.
  - `lib/load-*.ts`: readers of the processed feeds.

## Deployment

The demo runs on Vercel, which builds `web/` on every push to `main`. It uses the synthetic dataset, the only one in the repository.
