"use client";

import { useEffect, useRef, useState } from "react";
import { banners, logos } from "@/lib/game";
import { useHashTab } from "@/lib/use-hash-tab";
import { score } from "@/lib/timeline";
import { MatchStory } from "@/components/story";
import { Lineups } from "@/components/redesign/lineups";
import { Overview } from "@/components/redesign/overview";
import { PlayByPlay } from "@/components/redesign/play-by-play";
import { PlayerStats } from "@/components/redesign/player-stats";
import type { FlowPlay } from "@/lib/flow";

const tabs = [
  { id: "overview", label: "Overview" },
  { id: "plays", label: "Play-by-play" },
  { id: "lineups", label: "Lineups" },
  { id: "stats", label: "Player stats" },
  { id: "story", label: "Report & Preview" },
] as const;

export function RedesignCenter({ flow }: { flow: FlowPlay[] }) {
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
          <img src={logos.home} alt="" />
          <strong>
            {score[0]} : {score[1]}
          </strong>
          <img src={logos.away} alt="" />
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
        {tab === "overview" && <Overview flow={flow} />}
        {tab === "plays" && <PlayByPlay />}
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
