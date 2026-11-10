"""Build the game-flow feed from the raw event export."""

from common import EVENTS, ROOT, SLOTS, game_id, write_csv
from models import MINOR_PENALTY_MINUTES, PERIOD_SECONDS, EventType, GameState, Strength, Team

DESTINATION = ROOT / "data" / "processed" / "game_flow.csv"

PLAYER_IDS = ["EventPrimaryPlayerId", *(f"StartPlayerId{slot}" for slot in SLOTS)]
PLAYER_NAMES = ["EventPrimaryPlayerName", *(f"StartPlayerName{slot}" for slot in SLOTS)]


QUERY = f"""
WITH events AS (
    SELECT
        row_number() OVER () AS seq,
        *,
        (Period::INTEGER - 1) * {PERIOD_SECONDS} + MatchClock::INTEGER AS elapsed
    FROM read_csv(?, header = true, all_varchar = true)
),
names AS (
    SELECT map(list(player_id), list(name)) AS name_of
    FROM (
        SELECT
            player[1] AS player_id,
            arg_max(regexp_replace(player[2], '^#\\S+ ', ''), seq) AS name
        FROM events,
            UNNEST(list_zip(
                [{", ".join(PLAYER_IDS)}],
                [{", ".join(PLAYER_NAMES)}]
            )) AS listing(player)
        WHERE player[1] <> '' AND player[2] <> ''
        GROUP BY player_id
    )
)
SELECT
    ? AS game_id,
    Period::INTEGER AS period,
    printf('%02d:%02d', elapsed // 60, elapsed % 60) AS time,
    CASE EventPrimaryTeam
        WHEN '{Team.HOME}' THEN '{Team.HOME.side}'
        WHEN '{Team.AWAY}' THEN '{Team.AWAY.side}'
    END AS side,
    CASE EventType
        WHEN '{EventType.GOAL}' THEN '{EventType.GOAL.play_type}'
        WHEN '{EventType.PENALTY}' THEN '{EventType.PENALTY.play_type}'
    END AS type,
    CASE
        WHEN strength = '{Strength.HOME_POWERPLAY}' AND EventPrimaryTeam = '{Team.HOME}' THEN '{GameState.POWER_PLAY}'
        WHEN strength = '{Strength.AWAY_POWERPLAY}' AND EventPrimaryTeam = '{Team.AWAY}' THEN '{GameState.POWER_PLAY}'
        WHEN strength IN ('{Strength.HOME_POWERPLAY}', '{Strength.AWAY_POWERPLAY}') THEN '{GameState.PENALTY_KILL}'
        ELSE '{GameState.FULL_STRENGTH}'
    END AS game_state,
    CASE WHEN EventType = '{EventType.GOAL}' THEN home_goals || ':' || away_goals END AS score,
    CASE
        WHEN EventType = '{EventType.GOAL}' AND EventPrimaryTeam = '{Team.HOME}' THEN AwayGoalieOnIce = 'FALSE'
        WHEN EventType = '{EventType.GOAL}' AND EventPrimaryTeam = '{Team.AWAY}' THEN HomeGoalieOnIce = 'FALSE'
    END AS empty_net,
    CASE WHEN EventType = '{EventType.GOAL}' THEN name_of[EventPrimaryPlayerId] END AS shooter,
    CASE WHEN EventType = '{EventType.GOAL}' THEN name_of[GoalAssist1Id] END AS assist1,
    CASE WHEN EventType = '{EventType.GOAL}' THEN name_of[GoalAssist2Id] END AS assist2,
    CASE WHEN EventType = '{EventType.PENALTY}' THEN name_of[EventPrimaryPlayerId] END AS player,
    CASE
        WHEN EventType = '{EventType.PENALTY}'
        THEN lower(regexp_replace(PenaltyReason, '([a-z])([A-Z])', '\\1-\\2'))
    END AS penalty_type,
    CASE WHEN EventType = '{EventType.PENALTY}' THEN '{MINOR_PENALTY_MINUTES}' END AS penalty_minutes
FROM (
    SELECT
        *,
        last_value(nullif(TeamStrengthType, '') IGNORE NULLS) OVER (ORDER BY seq) AS strength,
        count(*) FILTER (WHERE EventType = '{EventType.GOAL}' AND EventPrimaryTeam = '{Team.HOME}')
            OVER (ORDER BY seq) AS home_goals,
        count(*) FILTER (WHERE EventType = '{EventType.GOAL}' AND EventPrimaryTeam = '{Team.AWAY}')
            OVER (ORDER BY seq) AS away_goals
    FROM events
) AS plays, names
WHERE EventType IN ('{EventType.GOAL}', '{EventType.PENALTY}')
ORDER BY seq
"""


def main() -> None:
    write_csv(QUERY, DESTINATION, [str(EVENTS), game_id(EVENTS)])


if __name__ == "__main__":
    main()
