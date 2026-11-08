import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import type { Side } from "@/lib/game";
import type { FlowPlay } from "@/lib/game-flow";

function source() {
  const fromWeb = path.join(process.cwd(), "../data/processed/game_flow.csv");
  return existsSync(fromWeb) ? fromWeb : path.join(process.cwd(), "data/processed/game_flow.csv");
}

export function loadGameFlow(): FlowPlay[] {
  const [header, ...lines] = readFileSync(source(), "utf8").trim().split(/\r?\n/);
  const keys = header.split(",");
  return lines.filter(Boolean).map((line) => {
    const cells = line.split(",");
    const row = Object.fromEntries(keys.map((key, index) => [key, cells[index] ?? ""]));
    return {
      period: Number(row.period),
      time: row.time,
      side: row.side as Side,
      type: row.type as FlowPlay["type"],
      gameState: row.game_state as FlowPlay["gameState"],
      score: row.score,
      emptyNet: row.empty_net === "true",
      shooter: row.shooter,
      assists: [row.assist1, row.assist2].filter(Boolean),
      player: row.player,
      penalty: row.penalty_type,
      minutes: Number(row.penalty_minutes) || 0,
    };
  });
}
