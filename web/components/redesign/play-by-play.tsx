import { PuckIcon, WhistleIcon } from "@/components/icons";
import { game, logos, type TickerItem } from "@/lib/game";
import { periodLabels, periodOf, periodScores, plays } from "@/lib/timeline";

function PlayCard({ item }: { item: TickerItem }) {
  const goal = item.type === "goal";
  const assists = [item.assist1, item.assist2].filter(Boolean).join(", ");
  return (
    <article className="rd-play-card">
      <div className="rd-play-top">
        <img src={logos[item.side]} alt={game[item.side]} />
        <span className="rd-tag">
          <span className="rd-icon">{goal ? <PuckIcon /> : <WhistleIcon />}</span>
          {goal ? "Goal" : "2 min"}
        </span>
        {goal && <strong className="rd-play-score">{item.score}</strong>}
      </div>
      {(item.shooter ?? item.player) && <p className="rd-play-main">{item.shooter ?? item.player}</p>}
      {assists && <p className="rd-play-sub">Assists: {assists}</p>}
      {item.foul && <p className="rd-play-sub">{item.foul}</p>}
    </article>
  );
}

export function PlayByPlay() {
  return (
    <div className="rd-plays">
      {periodScores.map(([home, away], period) => (
        <section key={periodLabels[period]}>
          <header className="rd-period-head">
            <h3>{periodLabels[period]}</h3>
            <span>
              {home} : {away}
            </span>
          </header>
          <ol className="rd-feed">
            {plays
              .filter((item) => periodOf(item.time) === period)
              .map((item, index) => (
                <li key={`${item.time}-${index}`} className={`rd-play ${item.side} ${item.type}`}>
                  <time>{item.time}</time>
                  <PlayCard item={item} />
                </li>
              ))}
          </ol>
        </section>
      ))}
      <p className="rd-updated">Last update: {game.updated}</p>
    </div>
  );
}
