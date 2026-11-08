"use client";

import { useEffect, useRef, useState } from "react";
import { GameFlow } from "@/components/redesign/game-flow";
import { Lineups } from "@/components/redesign/lineups";
import { PlayerStats } from "@/components/redesign/player-stats";
import { TeamStats } from "@/components/redesign/team-stats";
import { MatchStory } from "@/components/story";
import { banners, game, logos, type Side } from "@/lib/game";
import type { FlowPlay } from "@/lib/game-flow";
import type { TeamStat } from "@/lib/team-stats";
import { score } from "@/lib/timeline";
import { useHashTab } from "@/lib/use-hash-tab";

function MiniTeam({ side, short, goals }: { side: Side; short: string; goals: number }) {
  return (
    <span className={`rd-mini-side ${side}`}>
      <span className="rd-mini-name">
        <span className="rd-mini-full">{game[side]}</span>
        <span className="rd-mini-short">{short}</span>
      </span>
      <img src={logos[side]} alt="" />
      <span className="rd-mini-num">{goals}</span>
    </span>
  );
}

const tabs = [
  { id: "overview", label: "Overview" },
  { id: "team", label: "Team stats" },
  { id: "lineups", label: "Lineups" },
  { id: "stats", label: "Player stats" },
  { id: "story", label: "Report & Preview" },
] as const;

export function RedesignCenter({ flow, stats }: { flow: FlowPlay[]; stats: TeamStat[] }) {
  const [tab, select] = useHashTab(tabs);
  const [stuck, setStuck] = useState(false);
  const sentinel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => setStuck(entry.boundingClientRect.top < entry.rootBounds!.top),
      { rootMargin: "-48px 0px 0px 0px" },
    );
    observer.observe(sentinel.current!);
    return () => observer.disconnect();
  }, []);

  return (
    <div className="rd-page">
      <div ref={sentinel} />
      <div className={`rd-scorebar${stuck ? " stuck" : ""}`} aria-hidden="true">
        <div className="rd-wrap rd-mini">
          <MiniTeam side="home" short="USCS" goals={score[0]} />
          <span className="rd-mini-dash">-</span>
          <MiniTeam side="away" short="HCD" goals={score[1]} />
        </div>
      </div>
      <nav className="rd-tabbar" aria-label="Game center">
        <div className="rd-wrap rd-tabbar-inner">
          <div className="rd-tabs" role="tablist">
            {tabs.map((item) => (
              <button
                key={item.id}
                type="button"
                className="rd-tab"
                role="tab"
                id={`rd-tab-${item.id}`}
                aria-selected={tab === item.id}
                aria-controls="rd-panel"
                onClick={() => select(item.id)}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </nav>
      <main className="rd-wrap rd-main" id="rd-panel" role="tabpanel" aria-labelledby={`rd-tab-${tab}`}>
        {tab === "overview" && <GameFlow plays={flow} />}
        {tab === "team" && <TeamStats stats={stats} />}
        {tab === "lineups" && <Lineups />}
        {tab === "stats" && <PlayerStats />}
        {tab === "story" && (
          <div className="rd-stories">
            <section className="rd-card rd-story">
              <span className="rd-kicker">Match report</span>
              <MatchStory kind="report" />
            </section>
            <section className="rd-card rd-story">
              <span className="rd-kicker">Preview</span>
              <MatchStory kind="preview" />
            </section>
          </div>
        )}
      </main>
      <aside className="rd-wrap rd-partners" aria-label="Partners">
        {banners.map((banner) => (
          <img key={banner.alt} src={banner.src} alt={banner.alt} />
        ))}
      </aside>
    </div>
  );
}
