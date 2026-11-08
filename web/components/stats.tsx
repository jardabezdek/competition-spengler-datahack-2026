"use client";

import { useEffect, useState } from "react";
import { TeamTabs } from "@/components/team-tabs";
import { goalieStats, skaterStats, teamStats, type Side } from "@/lib/game";

function barWidth(value: number, other: number) {
  const scale = Math.max(value, other) + 20;
  return (value / scale) * 100;
}

export function formatPlusMinus(value: number) {
  return value > 0 ? `+${value}` : String(value);
}

function Bar({ side, value, other, grown }: { side: Side; value: number; other: number; grown: boolean }) {
  return (
    <div className={`bar-track ${side}`}>
      <div className={`bar-fill ${side}`} style={{ width: grown ? `${barWidth(value, other)}%` : "0%" }}>
        {value}
      </div>
    </div>
  );
}

function TeamBars() {
  const [grown, setGrown] = useState(false);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setGrown(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <div>
      {teamStats.map((stat) => (
        <div className="stat-row" key={stat.key}>
          <Bar side="home" value={stat.home} other={stat.away} grown={grown} />
          <div className="stat-key">{stat.key}</div>
          <Bar side="away" value={stat.away} other={stat.home} grown={grown} />
        </div>
      ))}
      <div className="legend">
        <h3>Legende</h3>
        {teamStats.map((stat) => (
          <div className="legend-row" key={stat.key}>
            <strong>{stat.key}</strong>
            <span>{stat.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function Stats() {
  const [view, setView] = useState<"team" | "player">("team");
  const [side, setSide] = useState<Side>("home");

  return (
    <div>
      <div className="subtabs" role="tablist" aria-label="Statistics">
        <button type="button" className="subtab" role="tab" aria-selected={view === "team"} onClick={() => setView("team")}>
          Teamstats
        </button>
        <button type="button" className="subtab" role="tab" aria-selected={view === "player"} onClick={() => setView("player")}>
          Playerstats
        </button>
      </div>

      {view === "team" ? (
        <TeamBars />
      ) : (
        <div>
          <TeamTabs side={side} onChange={setSide} />
          <h3 className="section-title">Player Stats</h3>
          <div className="table-wrap">
            <table className="stats-table">
              <thead>
                <tr>
                  <th>
                    <span className="sr-only">Player</span>
                  </th>
                  <th>Goals</th>
                  <th>Assists</th>
                  <th>Points</th>
                  <th>Plus/Minus</th>
                  <th>Time on Ice</th>
                </tr>
              </thead>
              <tbody>
                {skaterStats[side].map((player) => (
                  <tr key={player.number}>
                    <td>
                      {player.name} #{player.number}
                    </td>
                    <td>{player.goals}</td>
                    <td>{player.assists}</td>
                    <td>{player.points}</td>
                    <td>{formatPlusMinus(player.plusMinus)}</td>
                    <td>{player.toi} min</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <h3 className="section-title">Goalie Stats</h3>
          <div className="table-wrap">
            <table className="stats-table">
              <thead>
                <tr>
                  <th>
                    <span className="sr-only">Goalie</span>
                  </th>
                  <th>Shots Against</th>
                  <th>Saves</th>
                  <th>Goals Against</th>
                  <th>Save %</th>
                </tr>
              </thead>
              <tbody>
                {goalieStats[side].map((goalie) => (
                  <tr key={goalie.number}>
                    <td>
                      {goalie.name} #{goalie.number}
                    </td>
                    <td>{goalie.shotsAgainst}</td>
                    <td>{goalie.saves}</td>
                    <td>{goalie.goalsAgainst}</td>
                    <td>{goalie.savePct}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
