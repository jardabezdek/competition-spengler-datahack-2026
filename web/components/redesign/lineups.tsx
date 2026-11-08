"use client";

import { useState } from "react";
import { TeamTabs } from "@/components/team-tabs";
import { lineup, photos, type Position, type Side } from "@/lib/game";

const positions: Position[] = ["Stürmer", "Verteidiger", "Torhüter"];

export function Lineups() {
  const [side, setSide] = useState<Side>("home");

  return (
    <div>
      <TeamTabs side={side} onChange={setSide} />
      <div className="rd-lines">
        {lineup[side].map((line) => (
          <section key={line.title} className={`rd-line${line.title === "Goalkeeper" ? " goalies" : ""}`}>
            <h3>{line.title}</h3>
            {positions
              .map((position) => line.players.filter((player) => player.position === position))
              .filter((row) => row.length)
              .map((row) => (
                <div key={row[0].position} className="rd-row">
                  {row.map((player) => (
                    <div key={player.number} className="rd-player">
                      <span className="rd-player-photo">
                        <img src={photos[side][player.number]} alt="" />
                        <span className="rd-num">{player.number}</span>
                      </span>
                      <strong>{player.last}</strong>
                      <span>{player.first}</span>
                      <small>{player.position}</small>
                    </div>
                  ))}
                </div>
              ))}
          </section>
        ))}
      </div>
    </div>
  );
}
