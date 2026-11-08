import { useState } from "react";
import { GameFlow } from "@/components/redesign/game-flow";
import { game, logos, photos, sides, skaterStats, type Side } from "@/lib/game";
import type { FlowPlay } from "@/lib/game-flow";
import { lead, periods, split, type TeamStat } from "@/lib/team-stats";

function Comparison({ stats }: { stats: TeamStat[] }) {
  const [period, setPeriod] = useState("all");
  const [open, setOpen] = useState<string | null>(null);
  const rows = stats.filter((stat) => stat.period === period);

  return (
    <section className="rd-card full">
      <div className="rd-card-title center">
        <h3>Team comparison</h3>
      </div>
      <div className="rd-period-switch" role="tablist" aria-label="Period">
        {periods.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={period === item.id}
            onClick={() => setPeriod(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>
      <div className="rd-compare">
        {rows.map((stat) => {
          const widths = split(stat.home, stat.away);
          return (
            <div key={stat.id}>
              <div className="rd-compare-head">
                <strong className={lead(stat.home, stat.away)}>{stat.homeLabel}</strong>
                <span>
                  {stat.label}
                  {stat.description && (
                    <button
                      type="button"
                      className="rd-info"
                      aria-expanded={open === stat.id}
                      aria-label={`About ${stat.label}`}
                      onClick={() => setOpen(open === stat.id ? null : stat.id)}
                    >
                      i
                    </button>
                  )}
                </span>
                <strong className={lead(stat.away, stat.home)}>{stat.awayLabel}</strong>
              </div>
              {open === stat.id && <p className="rd-stat-note">{stat.description}</p>}
              <div className={widths ? "rd-split" : "rd-split empty"}>
                {widths ? (
                  <>
                    <span className="home" style={{ width: `${widths[0]}%` }} />
                    <span className="away" style={{ width: `${widths[1]}%` }} />
                  </>
                ) : (
                  <span />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function Leaders({ side }: { side: Side }) {
  const leaders = [...skaterStats[side]].sort((a, b) => b.points - a.points || b.goals - a.goals).slice(0, 3);
  return (
    <section className="rd-card half">
      <div className="rd-card-title start">
        <img src={logos[side]} alt="" />
        <h3>Top performers · {game[side]}</h3>
      </div>
      <ol className="rd-leaders">
        {leaders.map((player, index) => (
          <li key={player.number} className="rd-leader">
            <span className="rd-rank">{index + 1}</span>
            <span className="rd-avatar">
              <img src={photos[side][player.number]} alt="" />
            </span>
            <span>
              <strong>{player.name}</strong>
              <small>
                #{player.number} · {player.goals} G · {player.assists} A
              </small>
            </span>
            <span className="rd-points">
              {player.points}
              <small>PTS</small>
            </span>
          </li>
        ))}
      </ol>
    </section>
  );
}

export function Overview({ flow, stats }: { flow: FlowPlay[]; stats: TeamStat[] }) {
  return (
    <div className="rd-grid">
      <GameFlow plays={flow} />
      <Comparison stats={stats} />
      {sides.map((side) => (
        <Leaders key={side} side={side} />
      ))}
    </div>
  );
}
