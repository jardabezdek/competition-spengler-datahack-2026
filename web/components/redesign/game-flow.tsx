import { PuckIcon } from "@/components/icons";
import { flowRows, goalNotes, penaltyLabel, type FlowPlay, type FlowRow } from "@/lib/game-flow";
import { periodLabels } from "@/lib/timeline";

function Marker({ row }: { row: FlowRow }) {
  if (row.type === "goal") {
    const score = row.score.replace(":", " - ");
    const puck = <PuckIcon size={16} />;
    return (
      <span className="rd-puck">
        {row.side === "home" ? score : puck}
        {row.side === "home" ? puck : score}
      </span>
    );
  }
  return (
    <span className="rd-mins">
      {row.lengths.map((minutes, index) => (
        <span key={index} className="rd-min">
          {index > 0 && <span className="rd-plus">+</span>}
          {minutes}
        </span>
      ))}
    </span>
  );
}

function Description({ row }: { row: FlowRow }) {
  const player = row.type === "goal" ? row.shooter : row.player;
  const detail = row.type === "penalty" ? penaltyLabel(row.penalty) : goalNotes(row).join(", ");
  const name = player && <span className="rd-player-name">{player}</span>;
  const tag = detail && (
    <span className="rd-foul-wrap">
      <span className="rd-foul">({detail})</span>
    </span>
  );
  return (
    <div className="rd-beat-text">
      <p className="rd-beat-name">
        {row.side === "home" ? tag : name}
        {row.side === "home" ? name : tag}
      </p>
      {row.assists.length > 0 && <p className="rd-beat-note">{row.assists.join(" + ")}</p>}
    </div>
  );
}

function Event({ row }: { row: FlowRow }) {
  return (
    <li className={`rd-beat ${row.side}`}>
      <time>{row.time}</time>
      <div className="rd-beat-body">
        {row.side === "home" ? <Description row={row} /> : <Marker row={row} />}
        {row.side === "home" ? <Marker row={row} /> : <Description row={row} />}
      </div>
    </li>
  );
}

export function GameFlow({ plays }: { plays: FlowPlay[] }) {
  const feed = flowRows(plays);
  return (
    <section className="rd-card">
      <div className="rd-flow">
        {periodLabels.map((label, period) => (
          <section key={label}>
            <header className="rd-period-strip">
              <h3>{label}</h3>
            </header>
            <ol className="rd-spine">
              {feed
                .filter((play) => play.period === period + 1)
                .map((play, index) => (
                  <Event key={`${play.time}-${index}`} row={play} />
                ))}
            </ol>
          </section>
        ))}
      </div>
    </section>
  );
}
