import { RedesignCenter } from "@/components/redesign/center";
import { DataNotice } from "@/components/redesign/data-notice";
import { RedesignHero } from "@/components/redesign/hero";
import { SiteShell } from "@/components/site-shell";
import { loadGameFlow } from "@/lib/load-game-flow";
import { loadGoalReplays } from "@/lib/load-goal-replays";
import { loadPlayerStats } from "@/lib/load-player-stats";
import { loadTeamStats } from "@/lib/load-team-stats";
import { dataset } from "@/lib/project-files";
import "./redesign.css";

export default function RedesignPage() {
  const synthetic = dataset() === "synthetic";
  return (
    <SiteShell active="redesign" hero={<RedesignHero />} notice={synthetic && <DataNotice />}>
      <RedesignCenter
        flow={loadGameFlow()}
        replays={loadGoalReplays()}
        stats={loadTeamStats()}
        players={loadPlayerStats()}
      />
    </SiteShell>
  );
}
