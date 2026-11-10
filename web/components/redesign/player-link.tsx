import type { ReactNode } from "react";
import { profileByName } from "@/lib/game";

export function PlayerLink({ name, children }: { name: string; children?: ReactNode }) {
  const href = profileByName(name);
  const label = children ?? name;
  if (!href) return label;
  return (
    <a className="rd-player-link" href={href} target="_blank" rel="noreferrer">
      {label}
    </a>
  );
}
