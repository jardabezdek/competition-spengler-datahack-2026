import { game, ticker } from "@/lib/game";

export function minutes(time: string) {
  const [whole, seconds] = time.split(":").map(Number);
  return whole + seconds / 60;
}

export const periodOf = (time: string) => Math.floor(minutes(time) / 20);

export const periodLabels = ["1st period", "2nd period", "3rd period"];

export const plays = [...ticker].reverse();

export const score = game.score.split(":").map(Number);

export const periodScores = game.periods
  .slice(1, -1)
  .split(";")
  .map((period) => period.split(":").map(Number));
