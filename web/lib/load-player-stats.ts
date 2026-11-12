import { readDictionary } from "@/lib/data-dictionary";
import { game, sides } from "@/lib/game";
import type { PlayerPosition, PlayerStat, PlayerStatsData, StatKey } from "@/lib/player-stats";
import { csvNumber, processedFile, readCsv } from "@/lib/project-files";

const fields: Record<StatKey, string> = {
  toi: "toi",
  shifts: "shifts",
  goals: "goals",
  assists: "assists",
  points: "points",
  plusMinus: "plus_minus",
  pim: "pim",
  shots: "shots",
  shotsOnGoal: "shots_on_goal",
  xg: "xg",
  blockedShots: "blocked_shots",
  faceoffPct: "faceoff_pct",
  takeaways: "takeaways",
  giveaways: "giveaways",
  controlledEntries: "controlled_entries",
  controlledExits: "controlled_exits",
  shotsAgainst: "shots_against",
  saves: "saves",
  goalsAgainst: "goals_against",
  xgAgainst: "xg_against",
  savesAboveExpected: "saves_above_expected",
  savePct: "save_pct",
};

function firstSentence(text: string) {
  return text.split(/(?<=\.)\s/)[0];
}

export function loadPlayerStats(): PlayerStatsData {
  const dictionary = readDictionary("Player stats data dictionary");
  const players = readCsv(processedFile("player_stats.csv")).map((row) => {
    const stats = Object.entries(fields).map(([key, column]) => [
      key,
      key === "toi" ? row[column] : csvNumber(row[column]),
    ]);
    return {
      side: sides.find((side) => game[side] === row.team_name)!,
      id: row.player_id,
      name: row.player_name,
      number: Number(row.number),
      position: row.position as PlayerPosition,
      ...Object.fromEntries(stats),
    } as PlayerStat;
  });
  const notes = Object.fromEntries(
    Object.entries(fields).flatMap(([key, column]) => {
      const entry = dictionary.get(column);
      return entry ? [[key, { label: entry.label, description: firstSentence(entry.description) }]] : [];
    }),
  );
  return { players, notes };
}
