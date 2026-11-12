"use client";

import { useEffect, useState, type CSSProperties } from "react";
import { menu } from "@/lib/navigation";

export function SiteMenu() {
  const [open, setOpen] = useState(false);
  const [section, setSection] = useState<string | null>(null);
  // The view bar above the header scrolls away, so the menu opens under wherever the header is now.
  const [top, setTop] = useState(0);
  const below = { "--menu-top": `${top}px` } as CSSProperties;
  const active = menu.find((entry) => entry.label === section);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [open]);

  const close = () => {
    setSection(null);
    setOpen(false);
  };

  return (
    <>
      <button
        type="button"
        className={`menu-btn${open ? " open" : ""}`}
        aria-expanded={open}
        aria-controls="site-menu"
        onClick={(event) => {
          const header = event.currentTarget.closest(".site-header");
          if (header) setTop(header.getBoundingClientRect().bottom);
          setSection(null);
          setOpen((value) => !value);
        }}
      >
        <span className="hamburger" aria-hidden="true">
          <span />
          <span />
          <span />
        </span>
        Menu
      </button>
      {open && (
        <>
          <button type="button" className="menu-overlay" aria-label="Close menu" style={below} onClick={close} />
          <div className="menu-panel" id="site-menu" style={below} onMouseLeave={() => setSection(null)}>
            <div className={`menu-sections${active ? " joined" : ""}`}>
              {menu.map((entry) => {
                const selected = entry.label === section;
                return (
                  <button
                    key={entry.label}
                    type="button"
                    className={`menu-item${selected ? " active" : ""}`}
                    aria-expanded={selected}
                    onMouseEnter={() => setSection(entry.label)}
                  >
                    {entry.label}
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="m9 18 6-6-6-6" />
                    </svg>
                  </button>
                );
              })}
            </div>
            {active && (
              <div className="menu-flyout">
                {active.items.map((item) => (
                  <button key={item} type="button" className="menu-link">
                    {item}
                  </button>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </>
  );
}
