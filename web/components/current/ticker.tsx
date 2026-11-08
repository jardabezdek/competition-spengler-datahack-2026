import { PuckIcon, WhistleIcon } from "@/components/icons";
import { game, logos, ticker, type TickerItem } from "@/lib/game";

function Detail({ label, value }: { label: string; value?: string }) {
  if (!value) return null;
  return (
    <p>
      <span className="label">{label}: </span>
      {value}
    </p>
  );
}

function EventBody({ item }: { item: TickerItem }) {
  if (item.type === "penalty") {
    return (
      <div className="event">
        <div className="chip">
          <WhistleIcon />
          <span>2 MIN</span>
        </div>
        <Detail label="Player" value={item.player} />
        <Detail label="Foul" value={item.foul} />
      </div>
    );
  }

  return (
    <div className="event">
      <div className="chip">
        <PuckIcon />
        <span>{item.score}</span>
      </div>
      <Detail label="Shooter" value={item.shooter} />
      <Detail label="Assist 1" value={item.assist1} />
      <Detail label="Assist 2" value={item.assist2} />
    </div>
  );
}

export function Ticker() {
  return (
    <div>
      <div className="ticker-header">
        <div className="ticker-side">
          <img src={logos.home} alt="" />
          <span>{game.home}</span>
        </div>
        <div>Time</div>
        <div className="ticker-side away">
          <span>{game.away}</span>
          <img src={logos.away} alt="" />
        </div>
      </div>
      {ticker.map((item, index) => (
        <article
          key={`${item.time}-${item.type}-${item.side}-${index}`}
          className={`ticker-item${item.side === "away" ? " away" : ""}${index % 2 ? " alt" : ""}`}
        >
          {item.side === "home" ? <EventBody item={item} /> : <div />}
          <div className="time">{item.time}</div>
          {item.side === "away" ? <EventBody item={item} /> : <div />}
        </article>
      ))}
      <p className="updated">Last update: {game.updated}</p>
    </div>
  );
}
