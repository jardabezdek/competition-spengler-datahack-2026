"""Build goal replays: player and puck positions for the seconds before each goal."""

import json
from math import dist
from pathlib import Path

import duckdb

from common import EVENTS, PLAYERS, PROCESSED, ROOT, SLOTS, game_id
from models import (
    BLUE_LINE,
    PERIOD_SECONDS,
    CrossingDirection,
    CrossingResult,
    EventType,
    ShotResult,
    Team,
)

DESTINATION = PROCESSED / "goal_replays.json"

LEAD_SECONDS = 10
TAIL_SECONDS = 1.5
PUCK_SPEED = 20

CAPTIONED = {
    EventType.FACEOFF: "faceoff",
    EventType.PASS: "pass",
    EventType.BLUELINE_CROSSING: "crossing",
    EventType.DUMP: "dump",
    EventType.CLEAR: "clear",
    EventType.SHOT: "shot",
}


def read_rows(path: Path) -> list[dict]:
    relation = duckdb.execute(
        "SELECT * FROM read_csv(?, header = true, all_varchar = true)", [str(path)]
    )
    columns = [column[0] for column in relation.description]
    return [
        {key: value or "" for key, value in zip(columns, row)}
        for row in relation.fetchall()
    ]


def seconds(event: dict) -> float:
    return int(event["Timestamp"]) / 1000


def elapsed(event: dict) -> int:
    return (int(event["Period"]) - 1) * PERIOD_SECONDS + int(event["MatchClock"])


def point(value: str) -> list[float] | None:
    if not value:
        return None
    x, y = value.split(",")[:2]
    return [float(x), float(y)]


def side(team: str) -> str:
    return Team(team).side.value


def skaters(event: dict) -> dict[str, dict]:
    found = {}
    for slot in SLOTS:
        position = point(event[f"StartPlayerCoordinates{slot}"])
        if not position:
            continue
        velocity = None
        if event[f"StartPlayerDirection{slot}"]:
            speed = float(event[f"StartPlayerVelocity{slot}"])
            dx, dy = point(event[f"StartPlayerDirection{slot}"])
            velocity = [speed * dx, speed * dy]
        found[event[f"StartPlayerId{slot}"]] = {
            "position": position,
            "velocity": velocity,
            "side": side(event[f"StartPlayerTeam{slot}"]),
        }
    return found


def window(events: list[dict], shot: int, goal: int) -> list[dict]:
    start = shot
    while (
        start > 0
        and events[start - 1]["EventType"] != EventType.STOPPAGE
        and seconds(events[shot]) - seconds(events[start - 1]) <= LEAD_SECONDS
    ):
        start -= 1
    end = shot + 1
    while (
        end < goal
        and events[end]["EventType"] != EventType.STOPPAGE
        and seconds(events[end]) - seconds(events[shot]) <= TAIL_SECONDS
    ):
        end += 1
    return events[start:end]


def frames(clip: list[dict], origin: float) -> list[dict]:
    merged: list[dict] = []
    for event in clip:
        t = round(seconds(event) - origin, 2)
        if not merged or merged[-1]["t"] != t:
            merged.append({"t": t, "puck": None, "skaters": {}})
        frame = merged[-1]
        frame["puck"] = frame["puck"] or point(event["EventStartCoordinate"])
        frame["skaters"] = frame["skaters"] or skaters(event)
    fill_velocities(merged)
    return merged


def fill_velocities(merged: list[dict]) -> None:
    for index, frame in enumerate(merged):
        for player_id, skater in frame["skaters"].items():
            if skater["velocity"]:
                continue
            before = next(
                (f for f in reversed(merged[:index]) if player_id in f["skaters"]),
                frame,
            )
            after = next(
                (f for f in merged[index + 1 :] if player_id in f["skaters"]), frame
            )
            span = after["t"] - before["t"]
            if span <= 0:
                skater["velocity"] = [0, 0]
                continue
            start, end = (
                before["skaters"][player_id]["position"],
                after["skaters"][player_id]["position"],
            )
            skater["velocity"] = [
                (end[0] - start[0]) / span,
                (end[1] - start[1]) / span,
            ]


def finish_puck(
    merged: list[dict], clip: list[dict], origin: float, called: float
) -> None:
    """A long shot can still be travelling at the last event, so add where its movement ends."""
    movement = next(
        e for e in reversed(clip) if e["EventType"] == EventType.PUCK_CONTROL
    )
    end = point(movement["EventEndCoordinate"])
    before, last = [frame for frame in merged if frame["puck"]][-2:]
    remaining = dist(last["puck"], end)
    if remaining < 1:
        return
    measured = dist(before["puck"], last["puck"]) / (last["t"] - before["t"])
    speed = measured if measured > 5 else PUCK_SPEED
    arrival = min(last["t"] + remaining / speed, called - origin)
    merged.append({"t": round(arrival, 2), "puck": end, "skaters": {}})


def crossing(event: dict) -> str | None:
    if (
        event["BluelineCrossingDirection"] != CrossingDirection.TOWARDS_OPPONENT
        or event["BluelineCrossingResult"] != CrossingResult.POSSESSION_MAINTAINED
    ):
        return None
    attacking_right = event["EventPrimaryTeam"] == Team.HOME
    return (
        "entry"
        if (point(event["EventStartCoordinate"])[0] > 0) == attacking_right
        else "exit"
    )


def captions(clip: list[dict], origin: float) -> list[dict]:
    found = []
    for event in clip:
        kind = CAPTIONED.get(event["EventType"])
        if kind == "crossing":
            kind = crossing(event)
        if not kind or not event["EventPrimaryPlayerId"]:
            continue
        caption = {
            "t": round(seconds(event) - origin, 2),
            "kind": kind,
            "player": event["EventPrimaryPlayerId"],
        }
        if kind == "pass":
            caption["target"] = event["EventSecondaryPlayerId"]
            caption["result"] = event["PassResult"].lower()
        if kind == "shot":
            caption["result"] = event["ShotResult"].lower()
        found.append(caption)
    return found


def replay(events: list[dict], goal: int, roster: dict[str, dict]) -> dict:
    scorer = events[goal]
    shot = max(
        index
        for index in range(goal)
        if events[index]["EventType"] == EventType.SHOT
        and events[index]["ShotResult"] == ShotResult.GOAL
        and events[index]["EventPrimaryTeam"] == scorer["EventPrimaryTeam"]
    )
    origin = seconds(events[shot])
    clip = window(events, shot, goal)
    moments = frames(clip, origin)
    finish_puck(moments, clip, origin, seconds(scorer))
    sides = {
        player_id: skater["side"]
        for frame in moments
        for player_id, skater in frame["skaters"].items()
    }
    time = elapsed(scorer)
    return {
        "period": int(scorer["Period"]),
        "time": f"{time // 60:02d}:{time % 60:02d}",
        "side": side(scorer["EventPrimaryTeam"]),
        "shooter": scorer["EventPrimaryPlayerId"],
        "assists": [
            value
            for value in (scorer["GoalAssist1Id"], scorer["GoalAssist2Id"])
            if value
        ],
        "shotClock": elapsed(events[shot]),
        "players": {
            player_id: {
                "name": f"{roster[player_id]['first_name']} {roster[player_id]['last_name']}",
                "number": int(roster[player_id]["number"]),
                "side": player_side,
            }
            for player_id, player_side in sides.items()
        },
        "frames": [
            {
                "t": frame["t"],
                "puck": frame["puck"],
                "skaters": [
                    [
                        player_id,
                        *skater["position"],
                        *(round(v, 2) for v in skater["velocity"]),
                    ]
                    for player_id, skater in frame["skaters"].items()
                ],
            }
            for frame in moments
        ],
        "captions": captions(clip, origin),
    }


def main() -> None:
    events = read_rows(EVENTS)
    roster = {player["player_id"]: player for player in read_rows(PLAYERS)}
    goals = [
        index
        for index, event in enumerate(events)
        if event["EventType"] == EventType.GOAL
    ]
    replays = [replay(events, goal, roster) for goal in goals]
    DESTINATION.parent.mkdir(parents=True, exist_ok=True)
    payload = {"game_id": game_id(EVENTS), "blueLine": BLUE_LINE, "goals": replays}
    DESTINATION.write_text(json.dumps(payload, separators=(",", ":")) + "\n")
    print(f"Wrote {len(replays)} goal replays to {DESTINATION.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
