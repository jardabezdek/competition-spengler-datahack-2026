"use client";

import { useState } from "react";
import { TeamTabs } from "@/components/team-tabs";
import { formatPlusMinus } from "@/lib/format";
import { goalieStats, photos, skaterStats, type Side, type SkaterStat } from "@/lib/game";
import { minutes } from "@/lib/timeline";

const columns = [
  { key: "goals", label: "G", title: "Goals" },
  { key: "assists", label: "A", title: "Assists" },
  { key: "points", label: "PTS", title: "Points" },
  { key: "plusMinus", label: "+/-", title: "Plus/Minus" },
  { key: "toi", label: "TOI", title: "Time on Ice" },
] as const;

type SortKey = (typeof columns)[number]["key"];

const sortValue = (player: SkaterStat, key: SortKey) => (key === "toi" ? minutes(player.toi) : player[key]);

function PlayerCell({ side, name, number }: { side: Side; name: string; number: number }) {
  return (
    <td className="rd-who">
      <span className="rd-avatar small">
        <img src={photos[side][number]} alt="" />
      </span>
      {name}
      <small>#{number}</small>
    </td>
  );
}

export function PlayerStats() {
  const [side, setSide] = useState<Side>("home");
  const [sort, setSort] = useState<SortKey>("points");
  const skaters = [...skaterStats[side]].sort((a, b) => sortValue(b, sort) - sortValue(a, sort));

  return (
    <div className="rd-stack">
      <TeamTabs side={side} onChange={setSide} />
      <section className="rd-card">
        <h3 className="rd-card-title">Skaters</h3>
        <div className="rd-table-wrap">
          <table className="rd-table">
            <thead>
              <tr>
                <th>Player</th>
                {columns.map((column) => (
                  <th key={column.key} aria-sort={sort === column.key ? "descending" : undefined}>
                    <button type="button" title={column.title} onClick={() => setSort(column.key)}>
                      {column.label}
                    </button>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {skaters.map((player) => (
                <tr key={player.number}>
                  <PlayerCell side={side} name={player.name} number={player.number} />
                  {columns.map((column) => (
                    <td
                      key={column.key}
                      className={`${sort === column.key ? "sorted" : ""}${
                        column.key === "plusMinus" && player.plusMinus > 0 ? " up" : ""
                      }`}
                    >
                      {column.key === "plusMinus" ? formatPlusMinus(player.plusMinus) : player[column.key]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <section className="rd-card">
        <h3 className="rd-card-title">Goalies</h3>
        <div className="rd-table-wrap">
          <table className="rd-table">
            <thead>
              <tr>
                <th>Goalie</th>
                <th>Shots Against</th>
                <th>Saves</th>
                <th>Goals Against</th>
                <th>Save %</th>
              </tr>
            </thead>
            <tbody>
              {goalieStats[side].map((goalie) => (
                <tr key={goalie.number}>
                  <PlayerCell side={side} name={goalie.name} number={goalie.number} />
                  <td>{goalie.shotsAgainst}</td>
                  <td>{goalie.saves}</td>
                  <td>{goalie.goalsAgainst}</td>
                  <td>{goalie.savePct}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
