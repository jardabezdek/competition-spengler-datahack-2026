-include .env
export DATASET

.PHONY: venv transform generate-synthetic-data

venv:
	uv sync

generate-synthetic-data:
	uv run python scripts/generate_synthetic_data.py

transform:
	uv run python scripts/build_game_flow.py
	uv run python scripts/build_team_stats.py
	uv run python scripts/build_player_stats.py
	uv run python scripts/build_goal_replays.py
