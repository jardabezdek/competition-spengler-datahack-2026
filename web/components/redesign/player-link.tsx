"use client";

import type { ReactNode } from "react";
import { useLanguage } from "@/components/redesign/language";
import { profileByName } from "@/lib/game";

export function PlayerLink({ name, children }: { name: string; children?: ReactNode }) {
  const { language } = useLanguage();
  const href = profileByName(name, language);
  const label = children ?? name;
  if (!href) return label;
  return (
    <a className="rd-player-link" href={href} target="_blank" rel="noreferrer">
      {label}
    </a>
  );
}
