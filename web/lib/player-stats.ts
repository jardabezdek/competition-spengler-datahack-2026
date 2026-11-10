import type { DictionaryEntry } from "@/lib/data-dictionary";
import type { Side } from "@/lib/game";

export type PlayerPosition = "F" | "D" | "G";

export type PlayerStat = {
  side: Side;
  id: string;
  name: string;
  number: number;
  position: PlayerPosition;
  toi: string;
  shifts: number | null;
  goals: number | null;
  assists: number | null;
  points: number | null;
  plusMinus: number | null;
  pim: number | null;
  shots: number | null;
  shotsOnGoal: number | null;
  xg: number | null;
  blockedShots: number | null;
  faceoffPct: number | null;
  takeaways: number | null;
  giveaways: number | null;
  controlledEntries: number | null;
  controlledExits: number | null;
  shotsAgainst: number | null;
  saves: number | null;
  goalsAgainst: number | null;
  xgAgainst: number | null;
  savesAboveExpected: number | null;
  savePct: number | null;
};

export type StatKey = Exclude<keyof PlayerStat, "side" | "id" | "name" | "number" | "position">;

export type PlayerStatsData = {
  players: PlayerStat[];
  notes: Partial<Record<StatKey, DictionaryEntry>>;
};
