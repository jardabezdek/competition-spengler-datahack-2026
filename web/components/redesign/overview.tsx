import { GameFlow } from "@/components/redesign/game-flow";
import { game, goalieStats, logos, photos, sides, skaterStats, teamStats, type Side } from "@/lib/game";
import type { FlowPlay } from "@/lib/game-flow";

function Comparison() {
  return (
    <section className="rd-card main">
      <div className="rd-card-title">
        <img src={logos.home} alt={game.home} />
        <h3>Team comparison</h3>
        <img src={logos.away} alt={game.away} />
      </div>
      <div className="rd-compare">
        {teamStats.map((stat) => {
          const total = stat.home + stat.away || 1;
          return (
            <div key={stat.key}>
              <div className="rd-compare-head">
                <strong className={stat.home > stat.away ? "lead" : undefined}>{stat.home}</strong>
                <span>
                  {stat.label}
                  <abbr>{stat.key}</abbr>
                </span>
                <strong className={stat.away > stat.home ? "lead" : undefined}>{stat.away}</strong>
              </div>
              <div className="rd-split">
                <span className="home" style={{ width: `${(stat.home / total) * 100}%` }} />
                <span className="away" style={{ width: `${(stat.away / total) * 100}%` }} />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function Goaltending() {
  return (
    <section className="rd-card side">
      <h3 className="rd-card-title">Goaltending</h3>
      <div className="rd-goalies">
        {sides.map((side) => {
          const goalie = goalieStats[side][0];
          const saved = (goalie.saves / goalie.shotsAgainst) * 100;
          return (
            <div key={side} className="rd-goalie">
              <div className="rd-ring" style={{ "--pct": `${saved}%` } as React.CSSProperties}>
                <img src={photos[side][goalie.number]} alt="" />
              </div>
              <div>
                <strong>
                  {goalie.name} #{goalie.number}
                </strong>
                <span>{game[side]}</span>
                <dl>
                  <div>
                    <dt>SV%</dt>
                    <dd>{goalie.savePct}</dd>
                  </div>
                  <div>
                    <dt>Saves</dt>
                    <dd>
                      {goalie.saves}/{goalie.shotsAgainst}
                    </dd>
                  </div>
                  <div>
                    <dt>GA</dt>
                    <dd>{goalie.goalsAgainst}</dd>
                  </div>
                </dl>
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

export function Overview({ flow }: { flow: FlowPlay[] }) {
  return (
    <div className="rd-grid">
      <GameFlow plays={flow} />
      <Comparison />
      <Goaltending />
      {sides.map((side) => (
        <Leaders key={side} side={side} />
      ))}
    </div>
  );
}
