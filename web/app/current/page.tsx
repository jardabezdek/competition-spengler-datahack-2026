import { GameCenter } from "@/components/game-center";
import { GameHero } from "@/components/game-hero";
import { SiteShell } from "@/components/site-shell";

export default function CurrentPage() {
  return (
    <SiteShell active="current" hero={<GameHero />}>
      <GameCenter />
    </SiteShell>
  );
}
