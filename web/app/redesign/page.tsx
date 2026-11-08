import { RedesignCenter } from "@/components/redesign/center";
import { RedesignHero } from "@/components/redesign/hero";
import { SiteShell } from "@/components/site-shell";
import { loadGameFlow } from "@/lib/game-flow";
import "./redesign.css";

export default function RedesignPage() {
  return (
    <SiteShell active="redesign" hero={<RedesignHero />}>
      <RedesignCenter flow={loadGameFlow()} />
    </SiteShell>
  );
}
