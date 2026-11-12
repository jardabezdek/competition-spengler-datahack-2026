"use client";

import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { IconButton } from "@/components/redesign/icon-button";
import { PlayerLink } from "@/components/redesign/player-link";
import { game, logos, photos, sides } from "@/lib/game";
import { goalNotes, type FlowRow } from "@/lib/game-flow";
import {
  activeCaption,
  captionText,
  gameClock,
  puckPath,
  skaterAt,
  skaterTrail,
  timeRange,
  tracks,
  type GoalReplay,
  type Point,
} from "@/lib/goal-replay";
import { periodLabels } from "@/lib/timeline";

export type ReplayGoal = { row: FlowRow; replay: GoalReplay };

const GOAL_LINE = 26;
const CORNER = 8.5;
const CIRCLE = 4.5;
const DOT_Y = 7;
const NET = { width: 1.83, depth: 1.12 };
const CREASE = 1.8;
const speeds = [0.5, 1];

const line = (points: Point[]) => points.map(({ x, y }) => `${x.toFixed(2)},${(-y).toFixed(2)}`).join(" ");

const netX = (end: number) => (end > 0 ? GOAL_LINE : -GOAL_LINE - NET.depth);

function Net({ end, className }: { end: number; className: string }) {
  return <rect className={className} x={netX(end)} y={-NET.width / 2} width={NET.depth} height={NET.width} />;
}

function Markings({ blueLine }: { blueLine: number }) {
  return (
    <>
      <defs>
        <clipPath id="rd-replay-ice">
          <rect x="-30" y="-15" width="60" height="30" rx={CORNER} />
        </clipPath>
      </defs>
      <rect className="rd-replay-ice" x="-30" y="-15" width="60" height="30" rx={CORNER} />
      <g clipPath="url(#rd-replay-ice)">
        <line className="rd-replay-red" x1="0" y1="-15" x2="0" y2="15" strokeWidth="0.3" />
        <circle className="rd-replay-blue" cx="0" cy="0" r={CIRCLE} fill="none" strokeWidth="0.08" />
        <circle className="rd-replay-blue-fill" cx="0" cy="0" r="0.15" />
        {[-1, 1].map((end) => (
          <g key={end}>
            <line className="rd-replay-blue" x1={end * blueLine} y1="-15" x2={end * blueLine} y2="15" strokeWidth="0.3" />
            <line className="rd-replay-red" x1={end * GOAL_LINE} y1="-15" x2={end * GOAL_LINE} y2="15" strokeWidth="0.08" />
            <path
              className="rd-replay-crease"
              d={`M${end * GOAL_LINE} ${-CREASE} A${CREASE} ${CREASE} 0 0 ${end > 0 ? 0 : 1} ${end * GOAL_LINE} ${CREASE} Z`}
            />
            <Net end={end} className="rd-replay-net" />
            {[-DOT_Y, DOT_Y].map((y) => (
              <g key={y}>
                <circle className="rd-replay-red" cx={end * 20} cy={y} r={CIRCLE} fill="none" strokeWidth="0.08" />
                <circle className="rd-replay-red-fill" cx={end * 20} cy={y} r="0.3" />
                <circle className="rd-replay-red-fill" cx={end * (blueLine - 1.5)} cy={y} r="0.3" />
              </g>
            ))}
          </g>
        ))}
      </g>
      <rect className="rd-replay-boards" x="-30" y="-15" width="60" height="30" rx={CORNER} />
    </>
  );
}

function Replay({ replay, blueLine }: { replay: GoalReplay; blueLine: number }) {
  const { start, end } = timeRange(replay);
  const skaters = useMemo(() => tracks(replay), [replay]);
  const arrival = useMemo(() => replay.frames.findLast((frame) => frame.puck)!.t, [replay]);
  const [time, setTime] = useState(start);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const clock = useRef(start);

  const seek = (value: number) => {
    clock.current = value;
    setTime(value);
  };

  useEffect(() => {
    setPlaying(!window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }, []);

  useEffect(() => {
    if (!playing) return;
    let frame = 0;
    let last = performance.now();
    const step = (now: number) => {
      const next = Math.min(clock.current + ((now - last) / 1000) * speed, end);
      last = now;
      seek(next);
      if (next >= end) {
        setPlaying(false);
        return;
      }
      frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [playing, speed, end]);

  const toggle = () => {
    if (!playing && clock.current >= end) seek(start);
    setPlaying(!playing);
  };

  const puck = puckPath(replay, time);
  const current = activeCaption(replay, time);
  const percent = (t: number) => `${((t - start) / (end - start)) * 100}%`;

  return (
    <>
      <svg className="rd-replay-rink" viewBox="-30.5 -15.5 61 31" role="img" aria-label="Top-down replay of the goal">
        <Markings blueLine={blueLine} />
        <Net
          end={replay.side === "home" ? 1 : -1}
          className={`rd-replay-net-flash${time >= arrival ? " on" : ""}`}
        />
        {skaters.map((track) => {
          const trail = skaterTrail(track, time);
          return (
            trail.length > 1 && (
              <polyline
                key={`trail-${track.id}`}
                className={`rd-replay-trail ${replay.players[track.id].side}`}
                points={line(trail)}
              />
            )
          );
        })}
        <polyline className="rd-replay-puck-path" points={line(puck)} />
        {skaters.map((track) => {
          const position = skaterAt(track, time);
          const player = replay.players[track.id];
          return (
            position && (
              <g
                key={track.id}
                className={`rd-replay-player ${player.side}`}
                transform={`translate(${position.x.toFixed(2)} ${(-position.y).toFixed(2)})`}
                opacity={position.opacity}
              >
                <circle className="rd-replay-dot" r="1" />
                <text dominantBaseline="central">{player.number}</text>
              </g>
            )
          );
        })}
        <circle className="rd-replay-puck" cx={puck.at(-1)!.x.toFixed(2)} cy={(-puck.at(-1)!.y).toFixed(2)} r="0.42" />
      </svg>
      <div className="rd-replay-controls">
        <button type="button" className="rd-replay-play" onClick={toggle} aria-label={playing ? "Pause replay" : "Play replay"}>
          <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
            <path d={playing ? "M4 3h3v10H4zM9 3h3v10H9z" : "M4.5 2.5v11l9-5.5z"} fill="currentColor" />
          </svg>
        </button>
        <div className="rd-replay-scrub">
          <input
            type="range"
            min={start}
            max={end}
            step={0.01}
            value={time}
            aria-label="Replay position"
            aria-valuetext={`Game time ${gameClock(replay.shotClock + time)}`}
            onChange={(event) => {
              setPlaying(false);
              seek(Number(event.target.value));
            }}
          />
          <span className="rd-replay-ticks" aria-hidden="true">
            {replay.captions.map((caption, index) => (
              <span
                key={index}
                className={`rd-replay-tick${caption.result === "goal" ? " goal" : ""}`}
                style={{ left: percent(caption.t) }}
              />
            ))}
          </span>
        </div>
        <time className="rd-replay-clock">{gameClock(replay.shotClock + time)}</time>
        <div className="rd-replay-speed" role="group" aria-label="Playback speed">
          {speeds.map((value) => (
            <button key={value} type="button" aria-pressed={speed === value} onClick={() => setSpeed(value)}>
              {value}×
            </button>
          ))}
        </div>
      </div>
      <p className="rd-replay-caption" aria-live="polite">
        {current && captionText(current, replay.players)}
      </p>
    </>
  );
}

export function GoalReplayDialog({
  goals,
  blueLine,
  index,
  onSelect,
  onClose,
}: {
  goals: ReplayGoal[];
  blueLine: number;
  index: number | null;
  onSelect: (index: number) => void;
  onClose: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const goal = index === null ? null : goals[index];

  useEffect(() => {
    const element = dialog.current!;
    if (goal && !element.open) element.showModal();
    if (!goal && element.open) element.close();
  }, [goal]);

  return (
    <dialog
      ref={dialog}
      className="rd-replay"
      aria-label="Goal replay"
      onClose={onClose}
      onClick={(event) => {
        if (event.target === event.currentTarget) event.currentTarget.close();
      }}
    >
      {goal && index !== null && (
        <div className="rd-replay-panel">
          <header className="rd-replay-head">
            <div className="rd-replay-title">
              <span className="rd-replay-avatar">
                <img src={photos[goal.row.side][goal.replay.players[goal.replay.shooter].number]} alt="" />
              </span>
              <div className="rd-replay-title-text">
                <p className="rd-replay-kicker">
                  {periodLabels[goal.row.period - 1]} · {goal.row.time}
                  {goalNotes(goal.row).map((note) => (
                    <span key={note} className="rd-kicker">
                      {note}
                    </span>
                  ))}
                </p>
                <p className="rd-replay-scorer">
                  <PlayerLink name={goal.row.shooter} />
                  {goal.row.assists.length > 0 && (
                    <span className="rd-replay-assists">
                      {" ("}
                      {goal.row.assists.map((assist, position) => (
                        <Fragment key={assist}>
                          {position > 0 && " + "}
                          <PlayerLink name={assist} />
                        </Fragment>
                      ))}
                      )
                    </span>
                  )}
                </p>
              </div>
            </div>
            <nav className="rd-replay-actions" aria-label="Goal replay">
              <IconButton icon="previous" label="Previous goal" disabled={index === 0} onClick={() => onSelect(index - 1)} />
              <IconButton
                icon="next"
                label="Next goal"
                disabled={index === goals.length - 1}
                onClick={() => onSelect(index + 1)}
              />
              <IconButton icon="close" label="Close replay" onClick={onClose} />
            </nav>
          </header>

          <p className="rd-replay-teams">
            <span className="rd-replay-team home">
              <span className="rd-replay-team-name">{game.home}</span>
              <img src={logos.home} alt="" />
            </span>
            <span className="rd-replay-score">
              {goal.row.score.split(":").map((goals, position) => (
                <Fragment key={position}>
                  {position > 0 && " - "}
                  <span className={sides[position] === goal.row.side ? "scored" : undefined}>{goals}</span>
                </Fragment>
              ))}
            </span>
            <span className="rd-replay-team away">
              <img src={logos.away} alt="" />
              <span className="rd-replay-team-name">{game.away}</span>
            </span>
          </p>

          <Replay key={index} replay={goal.replay} blueLine={blueLine} />
        </div>
      )}
    </dialog>
  );
}
