import { game, goalieStats, logos, photos, sides, skaterStats, teamStats, type Side } from "@/lib/game";
import { flowRows, goalNotes, penaltyLabel, type FlowPlay, type FlowRow } from "@/lib/flow";
import { periodLabels } from "@/lib/timeline";

function Puck() {
  return (
    <svg width="16" height="16" viewBox="0 0 20 20" aria-hidden="true">
      <ellipse cx="10" cy="8" rx="7" ry="3.2" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <path d="M3 8v3.2a7 3.2 0 0 0 14 0V8" fill="none" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

function Event({ row }: { row: FlowRow }) {
  const goal = row.type === "goal";
  const player = goal ? row.shooter : row.player;
  const detail = row.type === "penalty" ? penaltyLabel(row.penalty) : goalNotes(row).join(", ");
  const tag = detail ? <span className="rd-foul">({detail})</span> : null;
  const name = player ? <span className="rd-player-name">{player}</span> : null;
  const home = row.side === "home";

  const icon = goal ? (
    <span className="rd-puck">
      <Puck />
      {row.score.replace(":", " : ")}
    </span>
  ) : (
    <span className="rd-mins">
      {row.lengths.map((minutes, index) => (
        <span key={index} className="rd-min">
          {index > 0 && <span className="rd-plus">+</span>}
          {minutes}
        </span>
      ))}
    </span>
  );

  const text = (
    <div className="rd-beat-text">
      <p className="rd-beat-name">
        {home ? (
          <>
            {tag && <span className="rd-foul-wrap">{tag}</span>}
            {name}
          </>
        ) : (
          <>
            {name}
            {tag && <span className="rd-foul-wrap">{tag}</span>}
          </>
        )}
      </p>
      {row.assists.length > 0 && <p className="rd-beat-note">{row.assists.join(" + ")}</p>}
    </div>
  );

  return (
    <li className={`rd-beat ${row.side}`}>
      <time>{row.time}</time>
      <div className="rd-beat-body">
        {home ? (
          <>
            {text}
            {icon}
          </>
        ) : (
          <>
            {icon}
            {text}
          </>
        )}
      </div>
    </li>
  );
}

function GameFlow({ plays }: { plays: FlowPlay[] }) {
  const feed = flowRows(plays);
  return (
    <section className="rd-card full">
      <div className="rd-flow">
        {periodLabels.map((label, period) => {
          const events = feed.filter((play) => play.period === period + 1);
          return (
            <section key={label}>
              <header className="rd-period-strip">
                <h3>{label}</h3>
              </header>
              <ol className="rd-spine">
                {events.map((event, index) => (
                  <Event key={`${event.time}-${index}`} row={event} />
                ))}
              </ol>
            </section>
          );
        })}
      </div>
    </section>
  );
}

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
