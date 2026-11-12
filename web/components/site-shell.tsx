import Link from "next/link";
import { Countdown } from "@/components/countdown";
import { SiteMenu } from "@/components/site-menu";
import { ViewSwitch, type View } from "@/components/view-switch";
import { shopUrl, ticketsUrl } from "@/lib/navigation";

function SearchIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="11" cy="11" r="7" fill="none" stroke="currentColor" strokeWidth="2" />
      <path d="M16.5 16.5 21 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function SiteHeader() {
  return (
    <header className="site-header">
      <div className="header-inner">
        <div className="header-side">
          <div className="header-row">
            <a className="tool-link" href={shopUrl} target="_blank" rel="noreferrer">
              Fanshop
            </a>
            <a className="tool-link" href={ticketsUrl} target="_blank" rel="noreferrer">
              Tickets
            </a>
          </div>
          <div className="header-rule" />
          <div className="header-row bottom">
            <SiteMenu />
          </div>
        </div>
        <Link href="/current" className="brand" aria-label="Spengler Cup Davos">
          <img src="/spengler-logo.svg" alt="" />
        </Link>
        <div className="header-side right">
          <div className="header-row end">
            <img className="sponsor" src="/norqain-logo.svg" alt="NORQAIN" />
            <Countdown />
          </div>
          <div className="header-rule" />
          <div className="header-row bottom end">
            <div className="lang" aria-label="Language">
              <span className="off">DE</span>
              <span className="bar">|</span>
              <span className="on">EN</span>
            </div>
            <SearchIcon />
          </div>
        </div>
      </div>
    </header>
  );
}

export function SiteShell({
  active,
  header = <SiteHeader />,
  hero,
  notice,
  children,
}: {
  active: View;
  header?: React.ReactNode;
  hero?: React.ReactNode;
  notice?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <>
      <div className="version-switch">
        <div className="version-switch-inner">
          <div className="version-links">
            <span className="version-label">View</span>
            <ViewSwitch active={active} />
          </div>
          {notice}
        </div>
      </div>
      {hero ? (
        <div className="mast">
          {header}
          {hero}
        </div>
      ) : (
        header
      )}
      {children}
      <footer className="site-footer">
        <div className="footer-inner">
          <p className="kicker">SPENGLER CUP DAVOS</p>
          <p>Hockey Club Davos AG</p>
          <p>Herbert Batliner Haus, Eisbahnstrasse 2, CH-7270 Davos Platz</p>
          <p>
            Tel. <a href="tel:+41814100466">+41 81 410 04 66</a>
          </p>
          <p>
            E-Mail: <a href="mailto:info@spenglercup.ch">info@spenglercup.ch</a>
          </p>
        </div>
      </footer>
    </>
  );
}
