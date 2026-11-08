export type TeamStat = {
  period: string;
  id: string;
  label: string;
  description: string;
  home: number | null;
  away: number | null;
  homeLabel: string;
  awayLabel: string;
};

export const periods = [
  { id: "all", label: "Game" },
  { id: "1", label: "1st Period" },
  { id: "2", label: "2nd Period" },
  { id: "3", label: "3rd Period" },
] as const;

export function lead(value: number | null, other: number | null) {
  return value != null && other != null && value > other ? "lead" : undefined;
}

export function split(home: number | null, away: number | null) {
  if (home == null || away == null) return null;
  const left = Math.abs(home);
  const right = Math.abs(away);
  const total = left + right;
  if (total === 0) return [50, 50];
  return [(left / total) * 100, (right / total) * 100];
}
