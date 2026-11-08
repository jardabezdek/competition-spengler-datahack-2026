import type { Side } from "@/lib/game";

export type FlowPlay = {
  period: number;
  time: string;
  side: Side;
  type: "goal" | "penalty";
  gameState: "fs" | "pp" | "pk";
  score: string;
  emptyNet: boolean;
  shooter: string;
  assists: string[];
  player: string;
  penalty: string;
  minutes: number;
};

export type FlowRow = FlowPlay & { lengths: number[] };

const penaltyNames: Record<string, string> = { delay: "Delay of game" };

export function penaltyLabel(value: string) {
  return penaltyNames[value] ?? value.charAt(0).toUpperCase() + value.slice(1);
}

export function goalNotes(play: FlowPlay) {
  if (play.type !== "goal") return [];
  const notes = [];
  if (play.gameState === "pp") notes.push("Power play");
  if (play.emptyNet) notes.push("Empty net");
  return notes;
}

export function flowRows(plays: FlowPlay[]) {
  const list: FlowRow[] = [];
  for (const play of plays) {
    const last = list.at(-1);
    const samePenalty =
      last?.type === "penalty" &&
      play.type === "penalty" &&
      last.period === play.period &&
      last.time === play.time &&
      last.side === play.side &&
      last.player === play.player &&
      last.penalty === play.penalty;
    if (last && samePenalty) {
      last.lengths.push(play.minutes);
      continue;
    }
    list.push({ ...play, lengths: play.type === "penalty" ? [play.minutes] : [] });
  }
  return list;
}
