"use client";

import { useState } from "react";
import { TeamTabs } from "@/components/team-tabs";
import { lineup, photos, type Side } from "@/lib/game";

export function Lineup() {
  const [side, setSide] = useState<Side>("home");
  const lines = lineup[side];

  return (
    <div>
      <TeamTabs side={side} onChange={setSide} />
      <div className="lines">
        {lines.map((line) => (
          <section className={`line${line.title === "Goalkeeper" ? " wide" : ""}`} key={line.title}>
            <h3 className="line-title">{line.title}</h3>
            <div className="line-players">
              {line.players.map((player) => (
                <div className="player" key={player.number}>
                  <div className="portrait">
                    <img src={photos[side][player.number]} alt="" />
                  </div>
                  <div>
                    <strong>
                      {player.last} {player.first} #{player.number}
                    </strong>
                    <span>{player.position}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
