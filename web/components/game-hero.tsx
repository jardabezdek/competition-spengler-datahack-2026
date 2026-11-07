import { game, logos } from "@/lib/game";

function ClockIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="2" />
      <path d="M12 7v6l3 2" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function PinIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M12 21s7-6.2 7-11a7 7 0 1 0-14 0c0 4.8 7 11 7 11z"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      />
      <circle cx="12" cy="10" r="2.2" fill="none" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

export function GameHero() {
  return (
    <section className="hero" aria-label="Final score">
      <img className="hero-photo" src={logos.hero} alt="" />
      <div className="hero-shade" />
      <div className="hero-content">
        <div className="pills">
          <div className="pill">
            <ClockIcon />
            {game.date} / {game.time}
          </div>
          <div className="pill">
            <PinIcon />
            {game.arena}
          </div>
        </div>
        <div className="teams">
          <div className="team home">
            <h1 className="team-name">{game.home}</h1>
            <img src={logos.home} alt="" />
          </div>
          <p className="score">{game.score}</p>
          <div className="team away">
            <img src={logos.away} alt="" />
            <h2 className="team-name">{game.away}</h2>
          </div>
        </div>
        <p className="periods">{game.periods}</p>
        <p className="status">{game.status}</p>
      </div>
    </section>
  );
}
