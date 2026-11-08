"use client";

import { useEffect, useState } from "react";

export function useHashTab<T extends string>(tabs: readonly { id: T }[]) {
  const [tab, setTab] = useState(tabs[0].id);

  useEffect(() => {
    const match = tabs.find((item) => item.id === window.location.hash.slice(1));
    if (match) setTab(match.id);
  }, [tabs]);

  function select(next: T) {
    setTab(next);
    window.history.replaceState(null, "", `#${next}`);
  }

  return [tab, select] as const;
}
