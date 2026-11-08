"use client";

import { useState } from "react";
import icon from "@/app/icon.png";
import { game, lineup, logos, photos, type Player, type Side } from "@/lib/game";

const lines = [
  { id: "1", label: "1st Line" },
  { id: "2", label: "2nd Line" },
  { id: "3", label: "3rd Line" },
  { id: "4", label: "4th Line" },
  { id: "subs", label: "Substitutes" },
] as const;

const formation: Record<Side, Record<string, number[]>> = {
  home: {
    "1": [19, 13, 18, 4, 2],
    "2": [14, 15, 86, 25, 23],
    "3": [9, 27, 8, 5, 44],
    "4": [21, 11, 22, 17],
  },
  away: {
    "1": [44, 74, 72, 77, 6],
    "2": [93, 70, 19, 55, 90],
    "3": [18, 15, 22, 38, 57],
    "4": [36, 66, 96, 12],
  },
};

const ice = { width: 1200, height: 520, goal: 74, blue: 350, net: 16 };
const half = ice.width / 2;
const between = (from: number, to: number) => `${(((from + to) / 2) / half) * 100}%`;

function forwardRows(count: number) {
  if (count >= 3) return ["20%", "50%", "80%"];
  if (count === 2) return ["36%", "64%"];
  return ["50%"];
}

function skaters(side: Side, line: string) {
  const groups = lineup[side];
  const title = line === "subs" ? "Line 5" : `Line ${line}`;
  const players = groups.find((row) => row.title === title)!.players;
  const numbers = formation[side][line];
  const ordered = numbers
    ? numbers.flatMap((number) => players.filter((player) => player.number === number))
    : players;
  return {
    forwards: ordered.filter((player) => player.position === "Stürmer"),
    defense: ordered.filter((player) => player.position === "Verteidiger"),
    goalie: groups.find((row) => row.title === "Goalkeeper")!.players[line === "subs" ? 1 : 0],
  };
}

function column(players: Player[], x: string, ys: string[]) {
  return players.map((player, index) => ({ player, x, y: ys[index] }));
}

function place(side: Side, line: string) {
  const { forwards, defense, goalie } = skaters(side, line);
  return [
    { player: goalie, x: "20%", y: "50%" },
    ...column(defense, between(ice.goal, ice.blue), defense.length > 1 ? ["24%", "76%"] : ["24%"]),
    ...column(forwards, between(ice.blue, half), forwardRows(forwards.length)),
  ];
}

function Skater({ player, side }: { player: Player; side: Side }) {
  return (
    <span className={`rd-skater ${side}`}>
      <span className="rd-skater-photo">
        <img src={photos[side][player.number]} alt="" />
        <span className="rd-skater-num">{player.number}</span>
      </span>
      <span className="rd-skater-name">
        {player.first[0]}. {player.last}
      </span>
    </span>
  );
}

function Half({ side, line }: { side: Side; line: string }) {
  return (
    <div className={`rd-rink-half ${side}`}>
      {place(side, line).map(({ player, x, y }) => (
        <span key={player.number} className="rd-spot" style={{ top: y, [side === "home" ? "left" : "right"]: x }}>
          <Skater player={player} side={side} />
        </span>
      ))}
    </div>
  );
}

function End() {
  return (
    <g>
      <line x1={ice.blue} y1="0" x2={ice.blue} y2={ice.height} stroke="#7eb6d6" strokeWidth="6" />
      <line x1={ice.goal} y1="0" x2={ice.goal} y2={ice.height} stroke="#e06a6a" strokeWidth="4" />
      <path d={`M${ice.goal} 222a28 28 0 0 1 0 56`} fill="none" stroke="#e06a6a" strokeWidth="4" />
      <rect x={ice.goal - ice.net} y="236" width={ice.net} height="36" fill="#e5f4fa" stroke="#8aa4b5" strokeWidth="4" />
    </g>
  );
}

function Ice() {
  return (
    <svg className="rd-rink-svg" viewBox={`0 0 ${ice.width} ${ice.height}`} aria-hidden="true">
      <defs>
        <rect id="rd-ice-shape" x="6" y="6" width={ice.width - 12} height={ice.height - 12} rx="140" />
        <clipPath id="rd-ice-clip">
          <use href="#rd-ice-shape" />
        </clipPath>
      </defs>
      <use href="#rd-ice-shape" fill="#e5f4fa" />
      <g clipPath="url(#rd-ice-clip)" strokeOpacity="0.4">
        <End />
        <g transform={`translate(${ice.width}) scale(-1 1)`}>
          <End />
        </g>
        <line x1={half} y1="0" x2={half} y2={ice.height} stroke="#e06a6a" strokeWidth="6" />
        <circle cx={half} cy={ice.height / 2} r="52" fill="#f7fbfd" stroke="#e06a6a" strokeWidth="4" strokeOpacity="0.55" />
      </g>
      <use href="#rd-ice-shape" fill="none" stroke="#c5d4de" strokeWidth="4" />
    </svg>
  );
}

export function Lineups() {
  const [line, setLine] = useState<string>("1");

  return (
    <section className="rd-card">
      <div className="rd-lineup-bar">
        <img className="rd-lineup-logo" src={logos.home} alt={game.home} />
        <div className="rd-period-switch" role="tablist" aria-label="Line">
          {lines.map((item) => (
            <button key={item.id} type="button" role="tab" aria-selected={line === item.id} onClick={() => setLine(item.id)}>
              {item.label}
            </button>
          ))}
        </div>
        <img className="rd-lineup-logo" src={logos.away} alt={game.away} />
      </div>
      <div className="rd-rink" style={{ aspectRatio: `${ice.width} / ${ice.height}` }} aria-label={`${lines.find((item) => item.id === line)!.label} on the rink`}>
        <Ice />
        <img className="rd-center-logo" src={icon.src} alt="" />
        <Half side="home" line={line} />
        <Half side="away" line={line} />
      </div>
    </section>
  );
}
