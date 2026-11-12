"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { useCountdown } from "@/components/countdown";
import { useLanguage } from "@/components/redesign/language";
import { localeNames, locales, redesignPath } from "@/lib/i18n";
import { shopUrl } from "@/lib/navigation";

const icons = {
  chevron: "m6 9 6 6 6-6",
  search: "M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14Zm5.5-1.5L21 21",
  close: "M6 6l12 12M18 6 6 18",
  menu: "M4 7h16M4 12h16M4 17h16",
  external: "M8 16 16 8M9 8h7v7",
};

function Icon({ name, size = 20 }: { name: keyof typeof icons; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <path d={icons[name]} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ExternalLink({ className, href, children }: { className: string; href: string; children: string }) {
  return (
    <a className={className} href={href} target="_blank" rel="noreferrer">
      {children}
      <Icon name="external" size={16} />
    </a>
  );
}

function useEscape(active: boolean, onEscape: () => void) {
  useEffect(() => {
    if (!active) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onEscape();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [active, onEscape]);
}

function useReducedMotion() {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  return reduced;
}

function LanguageSwitch() {
  const { language: current, t } = useLanguage();
  const router = useRouter();
  return (
    <nav className="rd-lang" aria-label={t.header.language}>
      {locales.map((language) => (
        <Link
          key={language}
          href={redesignPath(language)}
          hrefLang={language}
          lang={language}
          aria-label={localeNames[language]}
          aria-current={current === language ? "page" : undefined}
          onClick={(event) => {
            if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
            event.preventDefault();
            router.push(redesignPath(language) + window.location.hash, { scroll: false });
          }}
        >
          {language.toUpperCase()}
        </Link>
      ))}
    </nav>
  );
}

/** The ticking seconds stay hidden for people who ask for reduced motion. */
function countdownUnits([days, hours, minutes, seconds]: string[], labels: string[], reduced: boolean) {
  const units = [
    [days.replace(/^0(?=\d)/, ""), labels[0]],
    [hours, labels[1]],
    [minutes, labels[2]],
  ];
  if (!reduced) units.push([seconds, labels[3]]);
  return units;
}

function CountdownStrip() {
  const { t } = useLanguage();
  const units = countdownUnits(useCountdown(), t.header.units, useReducedMotion());

  return (
    <div className="rd-strip">
      <div className="rd-strip-inner">
        <div className="rd-strip-clock" role="timer" aria-label={t.header.countdown}>
          <span aria-hidden="true">{t.header.puckDrop}</span>
          <span className="rd-strip-time" aria-hidden="true">
            {units.map(([value, unit]) => (
              <span key={unit}>
                {value}
                <small>{unit}</small>
              </span>
            ))}
          </span>
        </div>
        <span aria-hidden="true">·</span>
        <span className="rd-strip-timed">
          <span className="rd-strip-timed-label">{t.header.timedBy}</span>
          <img src="/norqain-inline.svg" alt="NORQAIN" />
        </span>
      </div>
    </div>
  );
}

function MainNav() {
  const { t } = useLanguage();
  const [open, setOpen] = useState<string | null>(null);
  // A dropdown opened by hovering stays open on the first click instead of toggling shut.
  const viaHover = useRef(false);
  const nav = useRef<HTMLElement>(null);
  const id = useId();

  useEscape(open !== null, () => {
    nav.current?.querySelector<HTMLButtonElement>('[aria-expanded="true"]')?.focus();
    setOpen(null);
  });

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: PointerEvent) => {
      if (!nav.current?.contains(event.target as Node)) setOpen(null);
    };
    document.addEventListener("pointerdown", onPointer);
    return () => document.removeEventListener("pointerdown", onPointer);
  }, [open]);

  return (
    <nav
      ref={nav}
      className="rd-nav"
      aria-label={t.header.mainNav}
      onPointerLeave={(event) => {
        if (event.pointerType === "mouse") setOpen(null);
      }}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node)) setOpen(null);
      }}
    >
      <ul className="rd-nav-list">
        {t.header.menu.map((entry, index) => {
          const expanded = open === entry.label;
          const panel = `${id}-${index}`;
          return (
            <li
              key={entry.label}
              className="rd-nav-item"
              onPointerEnter={(event) => {
                if (event.pointerType !== "mouse" || expanded) return;
                viaHover.current = true;
                setOpen(entry.label);
              }}
            >
              <button
                type="button"
                className="rd-nav-trigger"
                aria-expanded={expanded}
                aria-controls={panel}
                onClick={() => {
                  setOpen(expanded && !viaHover.current ? null : entry.label);
                  viaHover.current = false;
                }}
              >
                {entry.label}
                <Icon name="chevron" size={16} />
              </button>
              <div id={panel} className={`rd-dropdown${expanded ? " open" : ""}`}>
                <div className="rd-dropdown-card">
                  <p className="rd-dropdown-kicker">{entry.label}</p>
                  <ul>
                    {entry.items.map((item) => (
                      <li key={item}>
                        <button type="button" className="rd-dropdown-link">
                          {item}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

function SearchPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useLanguage();
  const input = useRef<HTMLInputElement>(null);

  useEscape(open, onClose);

  useEffect(() => {
    if (open) input.current?.focus();
  }, [open]);

  return (
    <div id="rd-search" className={`rd-search${open ? " open" : ""}`}>
      <form className="rd-search-inner" role="search" onSubmit={(event) => event.preventDefault()}>
        <div className="rd-search-field">
          <Icon name="search" />
          <input ref={input} type="search" placeholder={t.header.searchPlaceholder} aria-label={t.header.searchLabel} />
          <button type="button" className="rd-icon-btn" aria-label={t.header.closeSearch} onClick={onClose}>
            <Icon name="close" />
          </button>
        </div>
        <div className="rd-quick">
          <span className="rd-quick-label">{t.header.popular}</span>
          {t.header.popularItems.map((item) => (
            <button key={item} type="button" className="rd-chip">
              {item}
            </button>
          ))}
        </div>
      </form>
    </div>
  );
}

function Drawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useLanguage();
  const [section, setSection] = useState<string | null>(null);
  const close = useRef<HTMLButtonElement>(null);
  const id = useId();

  useEscape(open, onClose);

  useEffect(() => {
    if (!open) return;
    close.current?.focus();
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  return (
    <div id="rd-drawer" className={`rd-drawer${open ? " open" : ""}`} role="dialog" aria-modal="true" aria-label={t.header.menuLabel}>
      <div className="rd-drawer-top">
        <button ref={close} type="button" className="rd-icon-btn" aria-label={t.header.closeMenu} onClick={onClose}>
          <Icon name="close" />
        </button>
        <span className="rd-brand">
          <img src="/spengler-logo.svg" alt="Spengler Cup Davos" />
        </span>
      </div>
      <nav className="rd-drawer-nav" aria-label={t.header.mainNav}>
        {t.header.menu.map((entry, index) => {
          const expanded = section === entry.label;
          const panel = `${id}-${index}`;
          return (
            <div key={entry.label} className="rd-acc">
              <button
                type="button"
                className="rd-acc-trigger"
                aria-expanded={expanded}
                aria-controls={panel}
                onClick={() => setSection(expanded ? null : entry.label)}
              >
                {entry.label}
                <Icon name="chevron" />
              </button>
              <ul id={panel} className="rd-acc-list" hidden={!expanded}>
                {entry.items.map((item) => (
                  <li key={item}>
                    <button type="button" className="rd-acc-link">
                      {item}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </nav>
      <div className="rd-drawer-foot">
        <div className="rd-drawer-row">
          <span>{t.header.language}</span>
          <LanguageSwitch />
        </div>
        <div className="rd-drawer-actions">
          <ExternalLink className="rd-ghost" href={shopUrl}>
            {t.header.shop}
          </ExternalLink>
          <ExternalLink className="rd-tickets" href={t.header.ticketsUrl}>
            {t.header.tickets}
          </ExternalLink>
        </div>
      </div>
    </div>
  );
}

export function RedesignHeader() {
  const [stuck, setStuck] = useState(false);
  const [searching, setSearching] = useState(false);
  const [drawer, setDrawer] = useState(false);
  const { language, t } = useLanguage();
  const header = useRef<HTMLElement>(null);
  const burger = useRef<HTMLButtonElement>(null);
  const searchButton = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const update = () => setStuck(window.scrollY > 0 && header.current!.getBoundingClientRect().top <= 0);
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, []);

  const closeSearch = useCallback(() => {
    setSearching(false);
    searchButton.current?.focus();
  }, []);
  const closeDrawer = useCallback(() => {
    setDrawer(false);
    burger.current?.focus();
  }, []);

  return (
    <>
      <header ref={header} className={`rd-header${stuck ? " stuck" : ""}${searching ? " searching" : ""}`}>
        <CountdownStrip />
        <div className="rd-header-inner">
          <button
            ref={burger}
            type="button"
            className="rd-icon-btn rd-burger"
            aria-label={t.header.openMenu}
            aria-expanded={drawer}
            aria-controls="rd-drawer"
            onClick={() => setDrawer(true)}
          >
            <Icon name="menu" />
          </button>
          <Link href={redesignPath(language)} className="rd-brand" aria-label="Spengler Cup Davos">
            <img src="/spengler-logo.svg" alt="" />
          </Link>
          <MainNav />
          <div className="rd-tools">
            <LanguageSwitch />
            <button
              ref={searchButton}
              type="button"
              className="rd-icon-btn"
              aria-label={t.header.search}
              aria-expanded={searching}
              aria-controls="rd-search"
              onClick={() => setSearching((value) => !value)}
            >
              <Icon name="search" />
            </button>
            <ExternalLink className="rd-shop" href={shopUrl}>
              {t.header.shop}
            </ExternalLink>
            <ExternalLink className="rd-tickets" href={t.header.ticketsUrl}>
              {t.header.tickets}
            </ExternalLink>
          </div>
        </div>
        <SearchPanel open={searching} onClose={closeSearch} />
      </header>
      <Drawer open={drawer} onClose={closeDrawer} />
    </>
  );
}
