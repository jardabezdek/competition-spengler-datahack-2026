"use client";

import { useEffect, useState } from "react";
import { banners } from "@/lib/game";
import { Lineup } from "@/components/lineup";
import { MatchStory } from "@/components/story";
import { Stats } from "@/components/stats";
import { Ticker } from "@/components/ticker";

const tabs = [
  { id: "ticker", label: "Ticker" },
  { id: "lineup", label: "LineUp" },
  { id: "stats", label: "Stats" },
  { id: "report", label: "Report" },
  { id: "preview", label: "Preview" },
] as const;

type TabId = (typeof tabs)[number]["id"];

function isTab(value: string): value is TabId {
  return tabs.some((tab) => tab.id === value);
}

export function GameCenter() {
  const [tab, setTab] = useState<TabId>("ticker");

  useEffect(() => {
    const hash = window.location.hash.replace("#", "");
    if (isTab(hash)) setTab(hash);
  }, []);

  function select(next: TabId) {
    setTab(next);
    window.history.replaceState(null, "", `#${next}`);
  }

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
              USC - HCD
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
