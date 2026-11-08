"use client";

import { banners, codes } from "@/lib/game";
import { useHashTab } from "@/lib/use-hash-tab";
import { Lineup } from "@/components/current/lineup";
import { Stats } from "@/components/current/stats";
import { Ticker } from "@/components/current/ticker";
import { MatchStory } from "@/components/story";

const tabs = [
  { id: "ticker", label: "Ticker" },
  { id: "lineup", label: "LineUp" },
  { id: "stats", label: "Stats" },
  { id: "report", label: "Report" },
  { id: "preview", label: "Preview" },
] as const;

export function GameCenter() {
  const [tab, select] = useHashTab(tabs);

  return (
    <div className="page-wrap">
      <nav className="crumbs" aria-label="breadcrumb">
        <ol>
          <li>
            <span>Home</span>
          </li>
          <li className="crumb-sep" aria-hidden="true">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </li>
          <li>
            <span className="crumb-here" aria-current="page">
              {codes.home} - {codes.away}
            </span>
          </li>
        </ol>
      </nav>
      <section>
        <div className="tabs" role="tablist" aria-label="Game center">
          {tabs.map((item) => (
            <button
              key={item.id}
              type="button"
              className="tab"
              role="tab"
              id={`tab-${item.id}`}
              aria-selected={tab === item.id}
              aria-controls={`panel-${item.id}`}
              onClick={() => select(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>
        <div role="tabpanel" id={`panel-${tab}`} aria-labelledby={`tab-${tab}`}>
          {tab === "ticker" && <Ticker />}
          {tab === "lineup" && <Lineup />}
          {tab === "stats" && <Stats />}
          {tab === "report" && <MatchStory kind="report" />}
          {tab === "preview" && <MatchStory kind="preview" />}
        </div>
      </section>
      <aside className="rail" aria-label="Partners">
        {banners.map((banner) => (
          <img key={banner.alt} src={banner.src} alt={banner.alt} />
        ))}
      </aside>
    </div>
  );
}
