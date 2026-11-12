import type { Side } from "@/lib/game";
import type { FlowPlay } from "@/lib/game-flow";
import { processedFile, readCsv } from "@/lib/project-files";

export function loadGameFlow(): FlowPlay[] {
  return readCsv(processedFile("game_flow.csv")).map((row) => ({
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
  }));
}
