import { GameCenter } from "@/components/current/game-center";
import { GameHero } from "@/components/current/game-hero";
import { SiteShell } from "@/components/site-shell";

export default function CurrentPage() {
  return (
    <SiteShell active="current" hero={<GameHero />}>
      <GameCenter />
    </SiteShell>
  );
}
