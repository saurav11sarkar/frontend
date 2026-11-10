import Link from "next/link";
import { Icon } from "./icon";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      <header className="site-header">
        <div className="header-inner">
          <Link href="/books" className="brand" aria-label="Folio library home">
            <span className="brand-icon">
              <Icon name="book" size={25} />
            </span>
            <span>
              folio<span className="brand-dot">.</span>
            </span>
          </Link>
          <nav aria-label="Main navigation">
            <Link href="/books" className="nav-link">
              <Icon name="book" size={17} /> Book collection
            </Link>
          </nav>
          <div className="header-label">
            <span className="live-dot" /> LIBRARY WORKSPACE
          </div>
        </div>
      </header>
      <main id="main-content" className="main-content">
        {children}
      </main>
      <footer className="site-footer">
        <span className="footer-brand">folio.</span>
        <span>A place for every book. A story for everyone.</span>
        <span>Library Book Manager</span>
      </footer>
    </>
  );
}
