import type { Side } from "@/lib/game";
import { readCsv, readProjectFile } from "@/lib/project-files";
import type { TeamStat } from "@/lib/team-stats";

const twoDecimals = new Intl.NumberFormat("en", { minimumFractionDigits: 2, maximumFractionDigits: 2, useGrouping: false });

const hidden = new Set(["FOW", "PP", "SOGA", "SV"]);

function dictionary() {
  const labels = new Map<string, { label: string; description: string }>();
  for (const line of readProjectFile("docs/data_dictionary.md").split(/\r?\n/)) {
    const cells = line.split("|").map((cell) => cell.trim());
    if (cells.length < 5 || cells[1] === "stat_id" || cells[1].startsWith("-")) continue;
    labels.set(cells[1], { label: cells[2], description: cells[3] });
  }
  return labels;
}

function number(value: string) {
  return value === "" ? null : Number(value);
}

function shown(value: string, percent: boolean) {
  if (!value) return "–";
  const rounded = (value.split(".")[1]?.length ?? 0) > 2 ? twoDecimals.format(value as `${number}`) : value;
  return percent ? `${rounded}%` : rounded;
}

function share(label: string, side: Side, part: number | null, total: number | null) {
  if (label === "–" || part == null || !total) return label;
  const fraction = `${part} / ${total}`;
  return side === "home" ? `${label} (${fraction})` : `(${fraction}) ${label}`;
}

function annotate(stats: TeamStat[]) {
  const value = (id: string, side: Side) => stats.find((item) => item.id === id)?.[side] ?? null;
  const fractions: Record<string, (stat: TeamStat, side: Side) => [number | null, number | null]> = {
    "FO%": (_, side) => {
      const home = value("FOW", "home");
      const away = value("FOW", "away");
      return [value("FOW", side), home == null || away == null ? null : home + away];
    },
    "PP%": (stat, side) => {
      const chances = value("PP", side);
      const rate = stat[side];
      return [rate == null || chances == null ? null : Math.round((rate / 100) * chances), chances];
    },
    "SV%": (_, side) => [value("SV", side), value("SOGA", side)],
  };
  return stats
    .filter((stat) => !hidden.has(stat.id))
    .map((stat) => {
      const fraction = fractions[stat.id];
      if (!fraction) return stat;
      return {
        ...stat,
        homeLabel: share(stat.homeLabel, "home", ...fraction(stat, "home")),
        awayLabel: share(stat.awayLabel, "away", ...fraction(stat, "away")),
      };
    });
}

export function loadTeamStats(): TeamStat[] {
  const labels = dictionary();
  const stats = readCsv("data/processed/team_stats.csv").map((row) => {
    const copy = labels.get(row.stat_id);
    const percent = row.stat_id.endsWith("%");
    return {
      period: row.period,
      id: row.stat_id,
      label: (copy?.label ?? row.stat_id).replace(/percentage/i, "%"),
      description: copy?.description ?? "",
      home: number(row.home),
      away: number(row.away),
      homeLabel: shown(row.home, percent),
      awayLabel: shown(row.away, percent),
    };
  });
  return [...new Set(stats.map((stat) => stat.period))].flatMap((period) =>
    annotate(stats.filter((stat) => stat.period === period)),
  );
}
