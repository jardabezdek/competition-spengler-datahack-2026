"use client";

import { useEffect, useId, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

type Anchor<Key> = { key: Key; left: number; top: number; start?: boolean };

export function useTooltip<Key>() {
  const [tip, setTip] = useState<Anchor<Key> | null>(null);
  const id = useId();

  useEffect(() => {
    if (!tip) return;
    const hide = () => setTip(null);
    window.addEventListener("scroll", hide, true);
    window.addEventListener("resize", hide);
    return () => {
      window.removeEventListener("scroll", hide, true);
      window.removeEventListener("resize", hide);
    };
  }, [tip]);

  const show = (key: Key, element: Element, start?: boolean) => {
    const box = element.getBoundingClientRect();
    setTip({ key, left: start ? box.left : box.right, top: box.top, start });
  };

  return { tip, id, show, hide: () => setTip(null) };
}

export function Tooltip({ tip, id, children }: { tip: Anchor<unknown>; id: string; children: ReactNode }) {
  return createPortal(
    <span className={`rd-tip${tip.start ? " start" : ""}`} role="tooltip" id={id} style={{ left: tip.left, top: tip.top }}>
      {children}
    </span>,
    document.body,
  );
}
