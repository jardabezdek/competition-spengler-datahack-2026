"use client";

import { useState } from "react";
import { SimulatedTag } from "@/components/redesign/data-notice";
import { PlayerLink } from "@/components/redesign/player-link";
import { Tooltip, useTooltip } from "@/components/redesign/tooltip";
import { game, photos, sides, type Side } from "@/lib/game";
import type { PlayerPosition, PlayerStat, PlayerStatsData, StatKey } from "@/lib/player-stats";
import { minutes } from "@/lib/timeline";

type Notes = PlayerStatsData["notes"];
type Direction = "descending" | "ascending";
type Sort = { key: StatKey; direction: Direction } | null;

type Column = {
  key: StatKey;
  label: string;
  digits?: number;
  percent?: boolean;
  signed?: boolean;
};

const skaterColumns: Column[] = [
  { key: "toi", label: "TOI" },
  { key: "shifts", label: "SHFT" },
  { key: "goals", label: "G" },
  { key: "assists", label: "A" },
  { key: "points", label: "PTS" },
  { key: "plusMinus", label: "+/-", signed: true },
  { key: "pim", label: "PIM" },
  { key: "shots", label: "S" },
  { key: "shotsOnGoal", label: "SOG" },
  { key: "xg", label: "xG", digits: 2 },
  { key: "blockedShots", label: "BKS" },
  { key: "takeaways", label: "TK" },
  { key: "giveaways", label: "GV" },
  { key: "controlledEntries", label: "CZE" },
  { key: "controlledExits", label: "CZX" },
];

const goalieColumns: Column[] = [
  { key: "toi", label: "TOI" },
  { key: "shotsAgainst", label: "SA" },
  { key: "saves", label: "SV" },
  { key: "goalsAgainst", label: "GA" },
  { key: "savePct", label: "SV%", percent: true },
  { key: "xgAgainst", label: "xGA", digits: 2 },
  { key: "savesAboveExpected", label: "GSAx", digits: 2, signed: true },
];

const byPoints: Sort = { key: "points", direction: "descending" };

const groups: { position: PlayerPosition; title: string; columns: Column[]; sort?: Sort }[] = [
  {
    position: "F",
    title: "Forwards",
    columns: [...skaterColumns, { key: "faceoffPct", label: "FO%", percent: true }],
    sort: byPoints,
  },
  { position: "D", title: "Defenders", columns: skaterColumns, sort: byPoints },
  { position: "G", title: "Goalies", columns: goalieColumns },
];

function numeric(player: PlayerStat, key: StatKey) {
  const value = player[key];
  return typeof value === "string" ? minutes(value) : value;
}

function compare(a: PlayerStat, b: PlayerStat, key: StatKey, direction: Direction) {
  const left = numeric(a, key);
  const right = numeric(b, key);
  if (left == null || right == null) return Number(left == null) - Number(right == null);
  return direction === "descending" ? right - left : left - right;
}

function nextSort(current: Sort, key: StatKey): Sort {
  if (current?.key !== key) return { key, direction: "descending" };
  return current.direction === "descending" ? { key, direction: "ascending" } : null;
}

function display(player: PlayerStat, column: Column) {
  const value = player[column.key];
  if (value == null) return "–";
  if (typeof value === "string") return value;
  if (column.percent) return `${value.toFixed(1)}%`;
  const sign = column.signed && value > 0 ? "+" : "";
  return sign + (column.digits ? value.toFixed(column.digits) : String(value));
}

function PlayerCell({ player }: { player: PlayerStat }) {
  return (
    <td className="rd-who">
      <span className="rd-avatar">
        <img src={photos[player.side][player.number]} alt="" />
      </span>
      <PlayerLink name={player.name} />
      <small>#{player.number}</small>
    </td>
  );
}

function StatsTable({
  title,
  players,
  columns,
  notes,
  initialSort,
}: {
  title: string;
  players: PlayerStat[];
  columns: Column[];
  notes: Notes;
  initialSort?: Sort;
}) {
  const [sort, setSort] = useState(initialSort ?? null);
  const tooltip = useTooltip<StatKey>();
  const note = tooltip.tip && notes[tooltip.tip.key];

  const rows = sort ? [...players].sort((a, b) => compare(a, b, sort.key, sort.direction)) : players;

  return (
    <div className="rd-player-group">
      <h3 className="rd-card-title">{title}</h3>
      <div className="rd-table-wrap">
        <table className="rd-table">
          <thead>
            <tr>
              <th>Player</th>
              {columns.map((column) => (
                <th
                  key={column.key}
                  aria-sort={sort?.key === column.key ? sort.direction : undefined}
                  onMouseEnter={(event) => tooltip.show(column.key, event.currentTarget)}
                  onMouseLeave={tooltip.hide}
                >
                  <button
                    type="button"
                    aria-label={notes[column.key]?.label}
                    aria-describedby={tooltip.tip?.key === column.key ? tooltip.id : undefined}
                    onClick={() => setSort(nextSort(sort, column.key))}
                    onFocus={(event) => {
                      const header = event.currentTarget.parentElement;
                      if (header && event.currentTarget.matches(":focus-visible")) tooltip.show(column.key, header);
                    }}
                    onBlur={tooltip.hide}
                  >
                    {column.label}
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((player) => (
              <tr key={player.id}>
                <PlayerCell player={player} />
                {columns.map((column) => {
                  const value = player[column.key];
                  const up = column.signed && typeof value === "number" && value > 0;
                  return (
                    <td key={column.key} className={`${sort?.key === column.key ? "sorted" : ""}${up ? " up" : ""}`}>
                      {display(player, column)}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {tooltip.tip && note && (
        <Tooltip tip={tooltip.tip} id={tooltip.id}>
          <strong>{note.label}</strong>
          {note.description}
        </Tooltip>
      )}
    </div>
  );
}

export function PlayerStats({ players, notes }: PlayerStatsData) {
  const [side, setSide] = useState<Side>("home");
  const shown = players.filter((player) => player.side === side);

  return (
    <section className="rd-card rd-tagged">
      <SimulatedTag />
      <div className="rd-period-switch" role="tablist" aria-label="Team">
        {sides.map((key) => (
          <button key={key} type="button" role="tab" aria-selected={side === key} onClick={() => setSide(key)}>
            {game[key]}
          </button>
        ))}
      </div>
      <div className="rd-player-groups">
        {groups.map((group) => (
          <StatsTable
            key={group.position}
            title={group.title}
            players={shown.filter((player) => player.position === group.position)}
            columns={group.columns}
            notes={notes}
            initialSort={group.sort}
          />
        ))}
      </div>
    </section>
  );
}
