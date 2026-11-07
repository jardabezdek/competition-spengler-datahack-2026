import Link from "next/link";
import { SiteShell } from "@/components/site-shell";

export default function RedesignPage() {
  return (
    <SiteShell active="redesign">
      <main className="placeholder">
        <h1>Redesigned game center</h1>
        <p>This route is ready. The new game center comes next.</p>
        <p>
          <Link href="/current">Back to the current page</Link>
        </p>
      </main>
    </SiteShell>
  );
}
