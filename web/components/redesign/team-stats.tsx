"use client";

import { useState } from "react";
import { useLanguage } from "@/components/redesign/language";
import { format } from "@/lib/i18n";
import { lead, periods, split, type TeamStat } from "@/lib/team-stats";

export function TeamStats({ stats }: { stats: TeamStat[] }) {
  const { t } = useLanguage();
  const [period, setPeriod] = useState<(typeof periods)[number]>("all");
  const [open, setOpen] = useState<string | null>(null);
  const rows = stats.filter((stat) => stat.period === period);

  return (
    <section className="rd-card">
      <div className="rd-period-switch" role="tablist" aria-label={t.teamStats.period}>
        {periods.map((item) => (
          <button key={item} type="button" role="tab" aria-selected={period === item} onClick={() => setPeriod(item)}>
            {t.teamStats.periods[item]}
          </button>
        ))}
      </div>
      <div className="rd-compare">
        {rows.map((stat) => {
          const copy = t.teamStats.stats?.[stat.id];
          const label = copy?.label ?? stat.label;
          const description = copy?.description ?? stat.description;
          const widths = split(stat.home, stat.away);
          return (
            <div key={stat.id}>
              <div className="rd-compare-head">
                <strong className={lead(stat.home, stat.away)}>{stat.homeLabel}</strong>
                <span>
                  {label}
                  {description && (
                    <button
                      type="button"
                      className="rd-info"
                      aria-expanded={open === stat.id}
                      aria-label={format(t.teamStats.about, { label })}
                      onClick={() => setOpen(open === stat.id ? null : stat.id)}
                    >
                      i
                    </button>
                  )}
                </span>
                <strong className={lead(stat.away, stat.home)}>{stat.awayLabel}</strong>
              </div>
              {open === stat.id && <p className="rd-stat-note">{description}</p>}
              <div className={widths ? "rd-split" : "rd-split empty"}>
                {widths ? (
                  <>
                    <span className="home" style={{ width: `${widths[0]}%` }} />
                    <span className="away" style={{ width: `${widths[1]}%` }} />
                  </>
                ) : (
                  <span />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
