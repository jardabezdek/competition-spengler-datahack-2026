"use client";

import { Fragment, useState } from "react";
import { PuckIcon } from "@/components/icons";
import { GoalReplayDialog, type ReplayGoal } from "@/components/redesign/goal-replay";
import { useLanguage } from "@/components/redesign/language";
import { PlayerLink } from "@/components/redesign/player-link";
import { Tooltip, useTooltip } from "@/components/redesign/tooltip";
import { flowRows, goalNotes, penaltyLabel, type FlowPlay, type FlowRow } from "@/lib/game-flow";
import { replayKey, type GoalReplays } from "@/lib/goal-replay";
import { format } from "@/lib/i18n";

function PlayIcon() {
  return (
    <svg className="rd-puck-play" width="10" height="10" viewBox="0 0 10 10" aria-hidden="true">
      <path d="M2 1v8l7-4z" fill="currentColor" />
    </svg>
  );
}

type Replay = { open: () => void; showTip: (element: Element) => void; hideTip: () => void; tipId?: string };

function Marker({ row, replay }: { row: FlowRow; replay?: Replay }) {
  const { t } = useLanguage();
  if (row.type === "goal") {
    const score = row.score.replace(":", " - ");
    const puck = <PuckIcon size={16} />;
    const content = (
      <>
        {row.side === "home" ? score : puck}
        {row.side === "home" ? puck : score}
      </>
    );
    if (!replay) return <span className="rd-puck">{content}</span>;
    return (
      <button
        type="button"
        className="rd-puck rd-puck-replay"
        onClick={replay.open}
        onMouseEnter={(event) => replay.showTip(event.currentTarget)}
        onMouseLeave={replay.hideTip}
        onFocus={(event) => {
          if (event.currentTarget.matches(":focus-visible")) replay.showTip(event.currentTarget);
        }}
        onBlur={replay.hideTip}
        aria-label={format(t.flow.replayLabel, { shooter: row.shooter, score })}
        aria-describedby={replay.tipId}
      >
        {row.side === "home" && <PlayIcon />}
        {content}
        {row.side === "away" && <PlayIcon />}
      </button>
    );
  }
  return (
    <span className="rd-mins">
      {row.lengths.map((minutes, index) => (
        <span key={index} className="rd-min">
          {index > 0 && <span className="rd-plus">+</span>}
          {minutes}
        </span>
      ))}
    </span>
  );
}

function Description({ row }: { row: FlowRow }) {
  const { t } = useLanguage();
  const player = row.type === "goal" ? row.shooter : row.player;
  const detail = row.type === "penalty" ? penaltyLabel(row.penalty, t.flow.penalties) : goalNotes(row, t.flow).join(", ");
  const name = player && (
    <span className="rd-player-name">
      <PlayerLink name={player} />
    </span>
  );
  const tag = detail && (
    <span className="rd-foul-wrap">
      <span className="rd-foul">({detail})</span>
    </span>
  );
  return (
    <div className="rd-beat-text">
      <p className="rd-beat-name">
        {row.side === "home" ? tag : name}
        {row.side === "home" ? name : tag}
      </p>
      {row.assists.length > 0 && (
        <p className="rd-beat-note">
          {row.assists.map((assist, index) => (
            <Fragment key={assist}>
              {index > 0 && " + "}
              <PlayerLink name={assist} />
            </Fragment>
          ))}
        </p>
      )}
    </div>
  );
}

function Event({ row, replay }: { row: FlowRow; replay?: Replay }) {
  const marker = <Marker row={row} replay={replay} />;
  return (
    <li className={`rd-beat ${row.side}`}>
      <time>{row.time}</time>
      <div className="rd-beat-body">
        {row.side === "home" ? <Description row={row} /> : marker}
        {row.side === "home" ? marker : <Description row={row} />}
      </div>
    </li>
  );
}

export function GameFlow({ plays, replays }: { plays: FlowPlay[]; replays: GoalReplays }) {
  const { t } = useLanguage();
  const feed = flowRows(plays);
  const [open, setOpen] = useState<number | null>(null);
  const tooltip = useTooltip<number>();
  const byKey = new Map(replays.goals.map((replay) => [replayKey(replay.period, replay.time), replay]));
  const goals: ReplayGoal[] = feed.flatMap((row) => {
    const replay = row.type === "goal" ? byKey.get(replayKey(row.period, row.time)) : undefined;
    return replay ? [{ row, replay }] : [];
  });

  return (
    <section className="rd-card">
      <div className="rd-flow">
        {t.periods.map((label, period) => (
          <section key={label}>
            <header className="rd-period-strip">
              <h3>{label}</h3>
            </header>
            <ol className="rd-spine">
              {feed
                .filter((play) => play.period === period + 1)
                .map((play, index) => {
                  const goal = goals.findIndex((item) => item.row === play);
                  const replay = goal < 0
                    ? undefined
                    : {
                        open: () => {
                          tooltip.hide();
                          setOpen(goal);
                        },
                        showTip: (element: Element) => tooltip.show(goal, element, play.side === "away"),
                        hideTip: tooltip.hide,
                        tipId: tooltip.tip?.key === goal ? tooltip.id : undefined,
                      };
                  return <Event key={`${play.time}-${index}`} row={play} replay={replay} />;
                })}
            </ol>
          </section>
        ))}
      </div>
      {tooltip.tip && (
        <Tooltip tip={tooltip.tip} id={tooltip.id}>
          <strong>{t.flow.replayTipTitle}</strong>
          {t.flow.replayTip}
        </Tooltip>
      )}
      <GoalReplayDialog
        goals={goals}
        blueLine={replays.blueLine}
        index={open}
        onSelect={setOpen}
        onClose={() => setOpen(null)}
      />
    </section>
  );
}
