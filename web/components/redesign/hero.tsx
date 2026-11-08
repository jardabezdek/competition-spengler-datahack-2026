import { game, logos, sides, type Side } from "@/lib/game";
import { score } from "@/lib/timeline";

function Team({ side }: { side: Side }) {
  return (
    <div className={`rd-team ${side}`}>
      <div className="rd-crest">
        <img src={logos[side]} alt="" />
      </div>
      <h2 className="rd-team-name">{game[side]}</h2>
    </div>
  );
}

export function RedesignHero() {
  return (
    <section className="rd-hero" aria-label="Final score">
      <div className="rd-hero-bg" aria-hidden="true">
        <span className="rd-glow" />
      </div>
      <div className="rd-wrap rd-hero-inner">
        <h1 className="sr-only">
          {game.home} vs. {game.away}
        </h1>
        <p className="rd-when">
          <time>{game.date}</time>
          <span>{game.time}</span>
        </p>
        <div className="rd-matchup">
          <Team side="home" />
          <div className="rd-board">
            <p className="rd-score" aria-label={`Final score ${game.score}`}>
              {sides.map((side, index) => (
                <span key={side}>{score[index]}</span>
              ))}
            </p>
            <p className="rd-end">End</p>
          </div>
          <Team side="away" />
        </div>
      </div>
    </section>
  );
}
