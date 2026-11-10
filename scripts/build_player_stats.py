"""Build skater and goalie stats from the raw event and aggregate exports."""

from common import (
    AGGREGATES,
    CONTROL,
    CONTROLLED,
    EVENTS,
    GIVEAWAY,
    ON_GOAL,
    PLAYERS,
    ROOT,
    SLOTS,
    game_id,
    write_csv,
)
from models import (
    MINOR_PENALTY_MINUTES,
    PERIOD_SECONDS,
    EventType,
    Position,
    PuckState,
    ShotResult,
    Team,
)

DESTINATION = ROOT / "data" / "processed" / "player_stats.csv"

ON_ICE_IDS = [f"StartPlayerId{slot}" for slot in SLOTS]
ON_ICE_TEAMS = [f"StartPlayerTeam{slot}" for slot in SLOTS]

OWN_CONTROL = (
    f"(team = '{Team.HOME}' AND puck_state = '{PuckState.HOME}') "
    f"OR (team = '{Team.AWAY}' AND puck_state = '{PuckState.AWAY}')"
)
BY_PLAYER = "primary_id = roster.player_id"
FACED = f"{ON_GOAL} AND EventSecondaryPlayerId = roster.player_id"


def net(team: Team) -> str:
    in_net = (
        f"list_filter(on_ice, lambda slot: slot[2] = '{team}' "
        f"AND list_contains(goalies, slot[1]))[1][1]"
    )
    return (
        f"CASE WHEN {team.side}_goalie "
        f"THEN last_value({in_net} IGNORE NULLS) OVER (ORDER BY seq) "
        f"END AS {team.side}_net"
    )


def skater(expression: str, name: str) -> str:
    return f"CASE WHEN position <> '{Position.GOALIE}' THEN {expression} END AS {name}"


def goalie(expression: str, name: str) -> str:
    return f"CASE WHEN position = '{Position.GOALIE}' AND seconds > 0 THEN {expression} END AS {name}"


QUERY = f"""
WITH events AS (
    SELECT
        row_number() OVER () AS seq,
        *,
        (Period::INTEGER - 1) * {PERIOD_SECONDS} + MatchClock::INTEGER AS elapsed,
        Period::INTEGER * {PERIOD_SECONDS} AS period_end,
        EventPrimaryPlayerId AS primary_id,
        EventPrimaryTeam AS team,
        nullif(PuckControlState, '') AS puck_state,
        try_cast(nullif(ShotXG, '') AS DOUBLE) AS xg,
        try_cast(split_part(EventStartCoordinate, ',', 1) AS DOUBLE) AS x
    FROM read_csv(?, header = true, all_varchar = true)
),
roster AS (
    SELECT row_number() OVER () AS listed, *
    FROM read_csv(?, header = true, types = {{'player_id': 'VARCHAR'}})
    WHERE game_id = ?
),
goalies AS (
    SELECT list(player_id) FILTER (WHERE position = '{Position.GOALIE}') AS goalies
    FROM roster
),
played AS (
    SELECT
        *,
        coalesce(lead(elapsed) OVER (PARTITION BY Period ORDER BY seq), period_end) - elapsed AS duration,
        last_value(nullif(HomeGoalieOnIce, '') IGNORE NULLS) OVER (ORDER BY seq) = 'TRUE' AS home_goalie,
        last_value(nullif(AwayGoalieOnIce, '') IGNORE NULLS) OVER (ORDER BY seq) = 'TRUE' AS away_goalie,
        list_filter(
            list_zip([{", ".join(ON_ICE_IDS)}], [{", ".join(ON_ICE_TEAMS)}]),
            lambda slot: slot[1] <> ''
        ) AS on_ice,
        CASE team WHEN '{Team.HOME}' THEN x > 0 WHEN '{Team.AWAY}' THEN x < 0 END AS toward_offense,
        CASE team WHEN '{Team.HOME}' THEN x < 0 WHEN '{Team.AWAY}' THEN x > 0 END AS toward_defense,
        last_value(CASE WHEN {CONTROL} THEN puck_state END IGNORE NULLS) OVER (
            ORDER BY seq
            ROWS BETWEEN UNBOUNDED PRECEDING AND 1 PRECEDING
        ) AS previous_control,
        first_value(
            CASE
                WHEN {CONTROL}
                THEN {{'state': puck_state, 'player_id': CASE WHEN {OWN_CONTROL} THEN primary_id END}}
            END
            IGNORE NULLS
        ) OVER (
            ORDER BY seq
            ROWS BETWEEN 1 FOLLOWING AND UNBOUNDED FOLLOWING
        ) AS next_control
    FROM events
),
nets AS (
    SELECT
        duration,
        {net(Team.HOME)},
        {net(Team.AWAY)}
    FROM played, goalies
),
goalie_time AS (
    SELECT goalie_id AS player_id, sum(duration) AS seconds
    FROM nets, UNNEST([home_net, away_net]) AS listing(goalie_id)
    WHERE goalie_id IS NOT NULL
    GROUP BY goalie_id
),
counts AS (
    SELECT
        roster.player_id,
        count(*) FILTER (WHERE EventType = '{EventType.GOAL}' AND {BY_PLAYER}) AS goals,
        count(*) FILTER (
            WHERE EventType = '{EventType.GOAL}' AND roster.player_id IN (GoalAssist1Id, GoalAssist2Id)
        ) AS assists,
        count(*) FILTER (WHERE EventType = '{EventType.PENALTY}' AND {BY_PLAYER}) * {MINOR_PENALTY_MINUTES} AS pim,
        count(*) FILTER (WHERE EventType = '{EventType.SHOT}' AND {BY_PLAYER}) AS shots,
        count(*) FILTER (WHERE {ON_GOAL} AND {BY_PLAYER}) AS shots_on_goal,
        coalesce(sum(xg) FILTER (WHERE EventType = '{EventType.SHOT}' AND {BY_PLAYER}), 0) AS xg,
        count(*) FILTER (
            WHERE puck_state = '{PuckState.CONTESTED}'
            AND next_control.player_id = roster.player_id
            AND previous_control <> next_control.state
        ) AS takeaways,
        count(*) FILTER (WHERE ({GIVEAWAY}) AND {BY_PLAYER}) AS giveaways,
        count(*) FILTER (WHERE {CONTROLLED} AND toward_offense AND {BY_PLAYER}) AS controlled_entries,
        count(*) FILTER (WHERE {CONTROLLED} AND toward_defense AND {BY_PLAYER}) AS controlled_exits,
        count(*) FILTER (WHERE {FACED}) AS shots_against,
        count(*) FILTER (WHERE {FACED} AND ShotResult = '{ShotResult.SAVED}') AS saves,
        count(*) FILTER (WHERE {FACED} AND ShotResult = '{ShotResult.GOAL}') AS goals_against,
        coalesce(sum(xg) FILTER (WHERE {FACED}), 0) AS xg_against
    FROM roster, played
    GROUP BY roster.player_id
),
aggregates AS (
    SELECT
        Team AS team_name,
        Jersey AS number,
        LastName AS last_name,
        "TOI (s)" AS seconds,
        Shifts AS shifts,
        "+" - "-" AS plus_minus,
        BKS AS blocked_shots,
        FOW AS faceoff_wins,
        "No. FO" AS faceoffs
    FROM read_csv(?, header = true)
),
stats AS (
    SELECT
        roster.*,
        min(listed) OVER (PARTITION BY team_name) AS team_order,
        counts.* EXCLUDE (player_id),
        aggregates.* EXCLUDE (team_name, number, last_name, seconds),
        CASE
            WHEN position = '{Position.GOALIE}' THEN coalesce(goalie_time.seconds, 0)
            ELSE aggregates.seconds
        END AS seconds
    FROM roster
    JOIN counts USING (player_id)
    LEFT JOIN aggregates USING (team_name, number, last_name)
    LEFT JOIN goalie_time USING (player_id)
)
SELECT
    game_id,
    team_name,
    player_id,
    first_name || ' ' || last_name AS player_name,
    number,
    position,
    printf('%02d:%02d', seconds // 60, seconds % 60) AS toi,
    {skater("shifts", "shifts")},
    {skater("goals", "goals")},
    {skater("assists", "assists")},
    {skater("goals + assists", "points")},
    {skater("plus_minus", "plus_minus")},
    {skater("pim", "pim")},
    {skater("shots", "shots")},
    {skater("shots_on_goal", "shots_on_goal")},
    {skater("printf('%.3f', xg)", "xg")},
    {skater("blocked_shots", "blocked_shots")},
    CASE
        WHEN position = '{Position.FORWARD}'
        THEN printf('%.1f', 100.0 * faceoff_wins / nullif(faceoffs, 0))
    END AS faceoff_pct,
    {skater("takeaways", "takeaways")},
    {skater("giveaways", "giveaways")},
    {skater("controlled_entries", "controlled_entries")},
    {skater("controlled_exits", "controlled_exits")},
    {goalie("shots_against", "shots_against")},
    {goalie("saves", "saves")},
    {goalie("goals_against", "goals_against")},
    {goalie("printf('%.3f', xg_against)", "xg_against")},
    {goalie("printf('%.3f', xg_against - goals_against)", "saves_above_expected")},
    {goalie("printf('%.1f', 100.0 * saves / nullif(shots_against, 0))", "save_pct")}
FROM stats
ORDER BY
    team_order,
    CASE position WHEN '{Position.FORWARD}' THEN 0 WHEN '{Position.DEFENSE}' THEN 1 ELSE 2 END,
    number
"""


def main() -> None:
    write_csv(
        QUERY,
        DESTINATION,
        [str(EVENTS), str(PLAYERS), game_id(EVENTS), str(AGGREGATES)],
    )


if __name__ == "__main__":
    main()
