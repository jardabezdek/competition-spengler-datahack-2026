.PHONY: venv transform

venv:
	uv sync

transform:
	uv run python scripts/build_game_flow.py
	uv run python scripts/build_team_stats.py
	uv run python scripts/build_player_stats.py
	uv run python scripts/build_goal_replays.py
