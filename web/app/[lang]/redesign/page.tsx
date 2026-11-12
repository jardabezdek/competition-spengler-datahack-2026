import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getDictionary } from "@/app/[lang]/dictionaries";
import { RedesignCenter } from "@/components/redesign/center";
import { DataNotice } from "@/components/redesign/data-notice";
import { RedesignHeader } from "@/components/redesign/header";
import { RedesignHero } from "@/components/redesign/hero";
import { LanguageProvider } from "@/components/redesign/language";
import { SiteShell } from "@/components/site-shell";
import { loadGameFlow } from "@/lib/load-game-flow";
import { loadGoalReplays } from "@/lib/load-goal-replays";
import { loadPlayerStats } from "@/lib/load-player-stats";
import { loadTeamStats } from "@/lib/load-team-stats";
import { hasLocale, locales, redesignPath } from "@/lib/i18n";
import { dataset } from "@/lib/project-files";
import "./redesign.css";

export async function generateMetadata({ params }: PageProps<"/[lang]/redesign">): Promise<Metadata> {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const { meta } = await getDictionary(lang);
  const languages = Object.fromEntries(locales.map((locale) => [locale, redesignPath(locale)]));
  return {
    ...meta,
    alternates: { canonical: redesignPath(lang), languages: { ...languages, "x-default": "/redesign" } },
  };
}

export default async function RedesignPage({ params }: PageProps<"/[lang]/redesign">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const dictionary = await getDictionary(lang);
  const synthetic = dataset() === "synthetic";
  return (
    <LanguageProvider language={lang} dictionary={dictionary}>
      <SiteShell active="redesign" header={<RedesignHeader />} hero={<RedesignHero />} notice={synthetic && <DataNotice />}>
        <RedesignCenter
          flow={loadGameFlow()}
          replays={loadGoalReplays()}
          stats={loadTeamStats()}
          players={loadPlayerStats()}
        />
      </SiteShell>
    </LanguageProvider>
  );
}
