"use client";

import { useEffect, useState } from "react";

const KICKOFF = new Date("2026-12-26T15:10:00+01:00").getTime();

function remaining(now: number) {
  const total = Math.max(0, Math.floor((KICKOFF - now) / 1000));
  const days = Math.floor(total / 86400);
  const hours = Math.floor((total % 86400) / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  return [days, hours, minutes, seconds].map((value) => String(value).padStart(2, "0"));
}

function ClockRow({ parts, className, hidden }: { parts: string[]; className: string; hidden?: boolean }) {
  const cells = parts.flatMap((part, index) => (index === 0 ? [part] : [":", part]));
  return (
    <div className={className} aria-hidden={hidden || undefined}>
      {cells.map((cell, index) => (
        <span key={index}>{cell}</span>
      ))}
    </div>
  );
}

export function Countdown() {
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    setNow(Date.now());
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const parts = now === null ? ["--", "--", "--", "--"] : remaining(now);

  return (
    <div className="countdown" role="timer" aria-label="Countdown to the first game on 26 December 2026 at 15:10 CET">
      <ClockRow className="countdown-time" parts={parts} />
      <ClockRow className="countdown-units" parts={["D", "H", "M", "S"]} hidden />
    </div>
  );
}
