"use client";

import { game, sides, type Side } from "@/lib/game";

export function TeamTabs({ side, onChange }: { side: Side; onChange: (side: Side) => void }) {
  return (
    <div className="subtabs" role="tablist" aria-label="Team">
      {sides.map((key) => (
        <button key={key} type="button" className="subtab" role="tab" aria-selected={side === key} onClick={() => onChange(key)}>
          {game[key]}
        </button>
      ))}
    </div>
  );
}
