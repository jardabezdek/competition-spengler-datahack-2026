"use client";

import Link from "next/link";
import { useState, type CSSProperties } from "react";

export const views = [
  { id: "current", label: "Current page", short: "Current" },
  { id: "redesign", label: "Redesigned page", short: "Redesign" },
] as const;

export type View = (typeof views)[number]["id"];

/** Segmented control between the two pages; the thumb slides on click, before the next page loads. */
export function ViewSwitch({ active }: { active: View }) {
  const [selected, setSelected] = useState(active);
  const index = views.findIndex((view) => view.id === selected);

  return (
    <nav className="view-switch" aria-label="View" style={{ "--index": index } as CSSProperties}>
      {views.map((view) => (
        <Link
          key={view.id}
          href={`/${view.id}`}
          className={selected === view.id ? "selected" : undefined}
          aria-current={active === view.id ? "page" : undefined}
          onClick={(event) => {
            if (!event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey) setSelected(view.id);
          }}
        >
          <span className="version-full">{view.label}</span>
          <span className="version-short">{view.short}</span>
        </Link>
      ))}
    </nav>
  );
}
