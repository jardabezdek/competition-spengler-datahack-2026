-include .env
export DATASET

.PHONY: venv transform generate-synthetic-data

venv:
	uv sync

generate-synthetic-data:
	uv run python -m spengler.synthetic.generate

transform:
	uv run python -m spengler.feeds.game_flow
	uv run python -m spengler.feeds.team_stats
	uv run python -m spengler.feeds.player_stats
	uv run python -m spengler.feeds.goal_replays
