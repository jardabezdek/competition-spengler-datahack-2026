import { game, logos, ticker, type TickerItem } from "@/lib/game";

function PuckIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" aria-hidden="true">
      <ellipse cx="10" cy="8" rx="7" ry="3.2" fill="none" stroke="white" strokeWidth="1.6" />
      <path d="M3 8v3.2a7 3.2 0 0 0 14 0V8" fill="none" stroke="white" strokeWidth="1.6" />
    </svg>
  );
}

function WhistleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" aria-hidden="true">
      <circle cx="7" cy="11" r="3.2" fill="none" stroke="white" strokeWidth="1.6" />
      <path d="M10 10.2 17 7.5v3.2L10 13" fill="none" stroke="white" strokeWidth="1.6" strokeLinejoin="round" />
    </svg>
  );
}

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
