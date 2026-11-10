import { RedesignCenter } from "@/components/redesign/center";
import { RedesignHero } from "@/components/redesign/hero";
import { SiteShell } from "@/components/site-shell";
import { loadGameFlow } from "@/lib/load-game-flow";
import { loadGoalReplays } from "@/lib/load-goal-replays";
import { loadPlayerStats } from "@/lib/load-player-stats";
import { loadTeamStats } from "@/lib/load-team-stats";
import "./redesign.css";

export default function RedesignPage() {
  return (
    <SiteShell active="redesign" hero={<RedesignHero />}>
      <RedesignCenter
        flow={loadGameFlow()}
        replays={loadGoalReplays()}
        stats={loadTeamStats()}
        players={loadPlayerStats()}
      />
    </SiteShell>
  );
}
