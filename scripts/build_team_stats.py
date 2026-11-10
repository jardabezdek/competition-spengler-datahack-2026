"""Build team comparison stats from the raw event export."""

from common import CONTROLLED, EVENTS, GIVEAWAY, ON_GOAL, ROOT, game_id, write_csv
from models import (
    MINOR_PENALTY_MINUTES,
    EventType,
    PuckState,
    ShotResult,
    Strength,
    Team,
    TeamStat,
)

DESTINATION = ROOT / "data" / "processed" / "team_stats.csv"

FACED = {
    Team.HOME: f"{ON_GOAL} AND team = '{Team.AWAY}' AND home_goalie",
    Team.AWAY: f"{ON_GOAL} AND team = '{Team.HOME}' AND away_goalie",
}
SAVES = f"count(*) FILTER (WHERE {{where}} AND ShotResult = '{ShotResult.SAVED}')"


def columns(name: str, home: str, away: str) -> str:
    return f"{home} AS home_{name},\n        {away} AS away_{name}"


def team_count(name: str, where: str) -> str:
    return columns(
        name,
        f"count(*) FILTER (WHERE {where} AND team = '{Team.HOME}')",
        f"count(*) FILTER (WHERE {where} AND team = '{Team.AWAY}')",
    )


def team_xg(name: str, where: str) -> str:
    return columns(
        name,
        f"round(sum(xg) FILTER (WHERE {where} AND team = '{Team.HOME}'), 3)",
        f"round(sum(xg) FILTER (WHERE {where} AND team = '{Team.AWAY}'), 3)",
    )


def power_plays(team: Team, strength: Strength) -> str:
    stretch = (
        f"count(*) FILTER (WHERE strength = '{strength}' "
        f"AND previous_strength IS DISTINCT FROM '{strength}')"
    )
    continued = (
        f"count(*) FILTER (WHERE EventType = '{EventType.GOAL}' AND team = '{team}' "
        f"AND strength = '{strength}' AND next_strength = '{strength}')"
    )
    return f"{stretch} + {continued} AS {team.side}_pp"


def crossings(name: str, home_sign: str, away_sign: str) -> str:
    return columns(
        name,
        f"count(*) FILTER (WHERE {CONTROLLED} AND team = '{Team.HOME}' AND x {home_sign} 0)",
        f"count(*) FILTER (WHERE {CONTROLLED} AND team = '{Team.AWAY}' AND x {away_sign} 0)",
    )


def faced(name: str, aggregate: str) -> str:
    return columns(
        name,
        aggregate.format(where=FACED[Team.HOME]),
        aggregate.format(where=FACED[Team.AWAY]),
    )


def stat_rows() -> str:
    rows = [
        (TeamStat.SHOTS_ON_GOAL, "%d", "home_sog", "away_sog"),
        (TeamStat.EXPECTED_GOALS, "%.3f", "home_xg", "away_xg"),
        (TeamStat.GOALS_ABOVE_EXPECTED, "%.3f", "home_g - home_xg", "away_g - away_xg"),
        (TeamStat.FACEOFF_WINS, "%d", "home_fow", "away_fow"),
        (
            TeamStat.FACEOFF_PERCENTAGE,
            "%.1f",
            "100.0 * home_fow / nullif(home_fow + away_fow, 0)",
            "100.0 * away_fow / nullif(home_fow + away_fow, 0)",
        ),
        (TeamStat.POWER_PLAYS, "%d", "home_pp", "away_pp"),
        (
            TeamStat.POWER_PLAY_PERCENTAGE,
            "%.1f",
            "100.0 * home_ppg / nullif(home_pp, 0)",
            "100.0 * away_ppg / nullif(away_pp, 0)",
        ),
        (TeamStat.PENALTY_MINUTES, "%d", "home_pim", "away_pim"),
        (TeamStat.BLOCKED_SHOTS, "%d", "home_bks", "away_bks"),
        (TeamStat.GIVEAWAYS, "%d", "home_gv", "away_gv"),
        (TeamStat.TAKEAWAYS, "%d", "home_tk", "away_tk"),
        (TeamStat.CONTROLLED_ENTRIES, "%d", "home_entries", "away_entries"),
        (TeamStat.CONTROLLED_EXITS, "%d", "home_exits", "away_exits"),
        (TeamStat.SHOTS_AGAINST, "%d", "home_soga", "away_soga"),
        (TeamStat.SAVES, "%d", "home_sv", "away_sv"),
        (
            TeamStat.SAVE_PERCENTAGE,
            "%.1f",
            "100.0 * home_sv / nullif(home_soga, 0)",
            "100.0 * away_sv / nullif(away_soga, 0)",
        ),
        (TeamStat.EXPECTED_GOALS_AGAINST, "%.3f", "home_xga", "away_xga"),
        (
            TeamStat.SAVES_ABOVE_EXPECTED,
            "%.3f",
            "home_xga - (home_soga - home_sv)",
            "away_xga - (away_soga - away_sv)",
        ),
    ]
    return "\n    UNION ALL\n    ".join(
        f"SELECT period, {index} AS sort, '{stat}' AS stat_id, "
        f"printf('{fmt}', {home}) AS home, printf('{fmt}', {away}) AS away FROM totals"
        for index, (stat, fmt, home, away) in enumerate(rows, 1)
    )


QUERY = f"""
WITH events AS (
    SELECT
        row_number() OVER () AS seq,
        Period AS period,
        EventType,
        EventPrimaryTeam AS team,
        nullif(TeamStrengthType, '') AS strength_raw,
        nullif(PuckControlState, '') AS puck_state,
        ShotResult,
        try_cast(nullif(ShotXG, '') AS DOUBLE) AS xg,
        HomeGoalieOnIce = 'TRUE' AS home_goalie,
        AwayGoalieOnIce = 'TRUE' AS away_goalie,
        PassResult,
        ClearType,
        BluelineCrossingDirection,
        BluelineCrossingResult,
        try_cast(split_part(EventStartCoordinate, ',', 1) AS DOUBLE) AS x
    FROM read_csv(?, header = true, all_varchar = true)
),
played AS (
    SELECT
        *,
        last_value(strength_raw IGNORE NULLS) OVER (ORDER BY seq) AS strength,
        ({GIVEAWAY}) AS giveaway,
        last_value(
            CASE WHEN puck_state IN ('{PuckState.HOME}', '{PuckState.AWAY}') THEN puck_state END
            IGNORE NULLS
        ) OVER (
            ORDER BY seq
            ROWS BETWEEN UNBOUNDED PRECEDING AND 1 PRECEDING
        ) AS previous_control,
        first_value(
            CASE WHEN puck_state IN ('{PuckState.HOME}', '{PuckState.AWAY}') THEN puck_state END
            IGNORE NULLS
        ) OVER (
            ORDER BY seq
            ROWS BETWEEN 1 FOLLOWING AND UNBOUNDED FOLLOWING
        ) AS next_control
    FROM events
),
marked AS (
    SELECT
        *,
        lag(strength) OVER (ORDER BY seq) AS previous_strength,
        lead(strength_raw IGNORE NULLS) OVER (ORDER BY seq) AS next_strength
    FROM played
),
totals AS (
    SELECT
        CASE WHEN grouping(period) = 1 THEN 'all' ELSE period END AS period,
        {team_count("sog", ON_GOAL)},
        {team_xg("xg", f"EventType = '{EventType.SHOT}'")},
        {team_count("g", f"EventType = '{EventType.GOAL}'")},
        {team_count("fow", f"EventType = '{EventType.FACEOFF}'")},
        {power_plays(Team.HOME, Strength.HOME_POWERPLAY)},
        {power_plays(Team.AWAY, Strength.AWAY_POWERPLAY)},
        {columns(
            "ppg",
            f"count(*) FILTER (WHERE EventType = '{EventType.GOAL}' AND team = '{Team.HOME}' AND strength = '{Strength.HOME_POWERPLAY}')",
            f"count(*) FILTER (WHERE EventType = '{EventType.GOAL}' AND team = '{Team.AWAY}' AND strength = '{Strength.AWAY_POWERPLAY}')",
        )},
        {columns(
            "pim",
            f"count(*) FILTER (WHERE EventType = '{EventType.PENALTY}' AND team = '{Team.HOME}') * {MINOR_PENALTY_MINUTES}",
            f"count(*) FILTER (WHERE EventType = '{EventType.PENALTY}' AND team = '{Team.AWAY}') * {MINOR_PENALTY_MINUTES}",
        )},
        {columns(
            "bks",
            f"count(*) FILTER (WHERE EventType = '{EventType.SHOT}' AND ShotResult = '{ShotResult.BLOCKED}' AND team = '{Team.AWAY}')",
            f"count(*) FILTER (WHERE EventType = '{EventType.SHOT}' AND ShotResult = '{ShotResult.BLOCKED}' AND team = '{Team.HOME}')",
        )},
        {team_count("gv", "giveaway")},
        {columns(
            "tk",
            f"count(*) FILTER (WHERE puck_state = '{PuckState.CONTESTED}' AND previous_control = '{PuckState.AWAY}' AND next_control = '{PuckState.HOME}')",
            f"count(*) FILTER (WHERE puck_state = '{PuckState.CONTESTED}' AND previous_control = '{PuckState.HOME}' AND next_control = '{PuckState.AWAY}')",
        )},
        {crossings("entries", ">", "<")},
        {crossings("exits", "<", ">")},
        {faced("soga", "count(*) FILTER (WHERE {where})")},
        {faced("sv", SAVES)},
        {faced("xga", "round(sum(xg) FILTER (WHERE {where}), 3)")},
    FROM marked
    GROUP BY GROUPING SETS ((period), ())
),
stats AS (
    {stat_rows()}
)
SELECT ? AS game_id, period, stat_id, home, away
FROM stats
ORDER BY CASE period WHEN 'all' THEN 0 ELSE period::INTEGER END, sort
"""


def main() -> None:
    write_csv(QUERY, DESTINATION, [str(EVENTS), game_id(EVENTS)])


if __name__ == "__main__":
    main()
