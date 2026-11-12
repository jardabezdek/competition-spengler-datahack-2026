import { readDictionary } from "@/lib/data-dictionary";
import type { Side } from "@/lib/game";
import { csvNumber, processedFile, readCsv } from "@/lib/project-files";
import type { TeamStat } from "@/lib/team-stats";

const twoDecimals = new Intl.NumberFormat("en", { minimumFractionDigits: 2, maximumFractionDigits: 2, useGrouping: false });

const order = ["SOG", "XG", "GAx", "PP%", "PIM", "FO%", "TK", "GV", "CZE", "CZX", "BKS", "SV%", "XGA", "GSAx"];

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
    .filter((stat) => order.includes(stat.id))
    .sort((a, b) => order.indexOf(a.id) - order.indexOf(b.id))
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
  const labels = readDictionary("Team stats data dictionary");
  const stats = readCsv(processedFile("team_stats.csv")).map((row) => {
    const copy = labels.get(row.stat_id);
    const percent = row.stat_id.endsWith("%");
    return {
      period: row.period,
      id: row.stat_id,
      label: (copy?.label ?? row.stat_id).replace(/percentage/i, "%"),
      description: copy?.description ?? "",
      home: csvNumber(row.home),
      away: csvNumber(row.away),
      homeLabel: shown(row.home, percent),
      awayLabel: shown(row.away, percent),
    };
  });
  return [...new Set(stats.map((stat) => stat.period))].flatMap((period) =>
    annotate(stats.filter((stat) => stat.period === period)),
  );
}
