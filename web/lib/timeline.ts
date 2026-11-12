import { game } from "@/lib/game";

export function minutes(time: string) {
  const [whole, seconds] = time.split(":").map(Number);
  return whole + seconds / 60;
}

export const score = game.score.split(":").map(Number);
