import type { Side } from "@/lib/game";

export type ReplayPlayer = { name: string; number: number; side: Side };

export type ReplaySkater = [id: string, x: number, y: number, vx: number, vy: number];

export type ReplayFrame = { t: number; puck: [number, number] | null; skaters: ReplaySkater[] };

export type ReplayCaption = {
  t: number;
  kind: "faceoff" | "pass" | "entry" | "exit" | "dump" | "clear" | "shot";
  player: string;
  target?: string;
  result?: string;
};

export type GoalReplay = {
  period: number;
  time: string;
  side: Side;
  shooter: string;
  assists: string[];
  shotClock: number;
  players: Record<string, ReplayPlayer>;
  frames: ReplayFrame[];
  captions: ReplayCaption[];
};

export type GoalReplays = { blueLine: number; goals: GoalReplay[] };

export type Point = { x: number; y: number };

type Key = { t: number; x: number; y: number; vx: number; vy: number };

export type Track = { id: string; keys: Key[]; enters: boolean; leaves: boolean };

const HOLD = 1;
const FADE = 0.3;
const GLIDE = 0.8;
const TRAIL_STEPS = 12;
const BOARDS = 14.4;
const CHANGE_SPEED = 2.5;
const CHANGE_TIME = 3;
const RINK = { x: 29.5, y: 14.5 };

export const replayKey = (period: number, time: string) => `${period}-${time}`;

export function timeRange(replay: GoalReplay) {
  return { start: replay.frames[0].t, end: replay.frames.at(-1)!.t + HOLD };
}

export function tracks(replay: GoalReplay): Track[] {
  const tracked = replay.frames.filter((frame) => frame.skaters.length > 0);
  const first = tracked[0].t;
  const last = tracked.at(-1)!.t;
  const keys = new Map<string, Key[]>();
  for (const frame of tracked) {
    for (const [id, x, y, vx, vy] of frame.skaters) {
      if (!keys.has(id)) keys.set(id, []);
      keys.get(id)!.push({ t: frame.t, x, y, vx, vy });
    }
  }
  return [...keys].map(([id, list]) => ({
    id,
    keys: list,
    enters: list[0].t > first,
    leaves: list.at(-1)!.t < last,
  }));
}

const clamp = (value: number, limit: number) => Math.max(-limit, Math.min(limit, value));

const onIce = ({ x, y }: Point): Point => ({ x: clamp(x, RINK.x), y: clamp(y, RINK.y) });

function between(a: Key, b: Key, t: number): Point {
  const span = b.t - a.t;
  const s = (t - a.t) / span;
  const h00 = 2 * s ** 3 - 3 * s ** 2 + 1;
  const h10 = s ** 3 - 2 * s ** 2 + s;
  const h01 = -2 * s ** 3 + 3 * s ** 2;
  const h11 = s ** 3 - s ** 2;
  return {
    x: h00 * a.x + h10 * span * a.vx + h01 * b.x + h11 * span * b.vx,
    y: h00 * a.y + h10 * span * a.vy + h01 * b.y + h11 * span * b.vy,
  };
}

const glide = (key: Key, seconds: number): Point => ({ x: key.x + key.vx * seconds, y: key.y + key.vy * seconds });

// Tracking drops players a few metres from the bench, so extend line changes to the nearest side boards.
function boards(key: Key, direction: 1 | -1): Key {
  const side = Math.sign(key.y) || 1;
  const speed = Math.max(key.vy * side * direction, CHANGE_SPEED);
  const time = Math.min(Math.max(0, BOARDS - Math.abs(key.y)) / speed, CHANGE_TIME);
  return {
    t: key.t + direction * time,
    x: clamp(key.x + key.vx * time * direction, RINK.x),
    y: side * BOARDS,
    vx: key.vx,
    vy: side * direction * speed,
  };
}

export function skaterAt(track: Track, t: number): (Point & { opacity: number }) | null {
  const { keys } = track;
  const first = keys[0];
  const last = keys.at(-1)!;
  if (t < first.t) {
    if (!track.enters) return { ...onIce(first), opacity: 1 };
    const entry = boards(first, -1);
    if (t >= entry.t) return { ...onIce(between(entry, first, t)), opacity: 1 };
    const early = entry.t - t;
    return early > FADE ? null : { ...onIce(entry), opacity: 1 - early / FADE };
  }
  if (t > last.t) {
    if (!track.leaves) return { ...onIce(glide(last, Math.min(t - last.t, GLIDE))), opacity: 1 };
    const exit = boards(last, 1);
    if (t <= exit.t) return { ...onIce(between(last, exit, t)), opacity: 1 };
    const late = t - exit.t;
    return late > FADE ? null : { ...onIce(exit), opacity: 1 - late / FADE };
  }
  const next = keys.findIndex((key) => key.t >= t);
  if (keys[next].t === t) return { ...onIce(keys[next]), opacity: 1 };
  return { ...onIce(between(keys[next - 1], keys[next], t)), opacity: 1 };
}

export function skaterTrail(track: Track, t: number): Point[] {
  return Array.from({ length: TRAIL_STEPS + 1 }, (_, step) => skaterAt(track, t - (TRAIL_STEPS - step) * 0.1)).filter(
    (position) => position !== null,
  );
}

export function puckPath(replay: GoalReplay, t: number): Point[] {
  const keys = replay.frames.flatMap((frame) => (frame.puck ? [{ t: frame.t, x: frame.puck[0], y: frame.puck[1] }] : []));
  const passed = keys.filter((key) => key.t <= t);
  const next = keys.find((key) => key.t > t);
  if (passed.length === 0) return [keys[0]];
  const last = passed.at(-1)!;
  if (!next) return passed;
  const s = (t - last.t) / (next.t - last.t);
  return [...passed, { x: last.x + (next.x - last.x) * s, y: last.y + (next.y - last.y) * s }];
}

export function activeCaption(replay: GoalReplay, t: number) {
  return replay.captions.findLast((caption) => caption.t <= t);
}

function playerLabel(player: ReplayPlayer) {
  return `#${player.number} ${player.name.split(" ").slice(1).join(" ")}`;
}

export function captionText(caption: ReplayCaption, players: Record<string, ReplayPlayer>) {
  const who = playerLabel(players[caption.player]);
  switch (caption.kind) {
    case "faceoff":
      return `${who} wins the faceoff`;
    case "pass":
      if (caption.result === "successful") return `${who} passes to ${playerLabel(players[caption.target!])}`;
      if (caption.result === "intercepted") return `${who}'s pass is intercepted`;
      return `${who}'s pass misses its target`;
    case "entry":
      return `${who} carries the puck into the zone`;
    case "exit":
      return `${who} carries the puck out of the zone`;
    case "dump":
      return `${who} dumps the puck`;
    case "clear":
      return `${who} clears the puck`;
    case "shot":
      if (caption.result === "goal") return `Goal! ${who} scores`;
      if (caption.result === "saved") return `${who}'s shot is saved`;
      if (caption.result === "blocked") return `${who}'s shot is blocked`;
      return `${who} misses the net`;
  }
}

export function gameClock(seconds: number) {
  const whole = Math.floor(seconds);
  return `${String(Math.floor(whole / 60)).padStart(2, "0")}:${String(whole % 60).padStart(2, "0")}`;
}
