'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import Footer from './Footer';
import Container from './Container';
import ProfileMenu from './ProfileMenu';

/**
 * The customer-facing chrome (topbar + footer). Mounted by the (site) route group
 * only, so the /admin subtree never renders it. `authed` is derived server-side
 * (the session cookie) and passed down so this client component stays serializable.
 *
 * The nav ends with the one primary action on the site, so a visitor can start the
 * funnel from any page without scrolling back to a section CTA. It shows for signed
 * in customers too: buying again is a normal thing to do.
 *
 * Below 820px the links collapse into a drawer behind a burger. Before this the bar
 * hid items by media query as it narrowed, which meant a phone simply could not
 * reach Blog or Sign Up at all.
 */
function Burger({ open, onClick }) {
  return (
    <button
      type="button"
      className={`burger${open ? ' burger--open' : ''}`}
      aria-label={open ? 'Close menu' : 'Open menu'}
      aria-expanded={open}
      aria-controls="site-menu"
      onClick={onClick}
    >
      <span aria-hidden="true" />
      <span aria-hidden="true" />
      <span aria-hidden="true" />
    </button>
  );
}

export default function SiteChrome({ authed, email, children }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const inFunnel = FUNNEL_BASES.some((base) => pathname?.startsWith(`${base}/`));

  // Navigating with the drawer open would otherwise leave it open on the new page.
  useEffect(() => setOpen(false), [pathname]);

  // Escape closes it, and the page behind must not scroll while it is over the top.
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open]);

  const links = (
    <>
      <a className="navlink" href="/pricing">
        Pricing
      </a>
      <a className="navlink" href="/blog">
        Blog
      </a>
      {authed ? (
        <ProfileMenu email={email} />
      ) : (
        <a className="navlink" href="/login">
          Log in
        </a>
      )}
      <a className="navcta" href="/ai-headshot-generator/select">
        Get my headshots
      </a>
    </>
  );

  if (inFunnel) {
    return (
      <>
        <header className="topbar topbar--funnel">
          <Container>
            <div className="topbar__inner">
              <a className="brand" href="/ai-headshot-generator" aria-label="Picturesk.ai home">
                <span className="brand__word">Picturesk</span>
              </a>
              <a className="navlink" href="mailto:info@picturesk.ai">
                Need help?
              </a>
            </div>
          </Container>
        </header>
        {children}
        <footer className="footer footer--funnel">
          <Container>
            <p className="footer__legal">
              <span>© 2026 Picturesk.ai</span>
              <span>
                <a href="/refunds">Refunds</a> · <a href="/terms">Terms</a> ·{' '}
                <a href="/privacy">Privacy</a>
              </span>
            </p>
          </Container>
        </footer>
      </>
    );
  }

  return (
    <>
      <header className="topbar">
        <Container>
          <div className="topbar__inner">
            <a className="brand" href="/ai-headshot-generator" aria-label="Picturesk.ai home">
              <span className="brand__word">Picturesk</span>
            </a>
            <nav className="nav nav--desktop">{links}</nav>
            <Burger open={open} onClick={() => setOpen((v) => !v)} />
          </div>
        </Container>

        <div id="site-menu" className={`drawer${open ? ' drawer--open' : ''}`} hidden={!open}>
          <Container>
            <nav className="drawer__nav">{links}</nav>
          </Container>
        </div>
      </header>
      {open && <div className="drawer__scrim" onClick={() => setOpen(false)} aria-hidden="true" />}
      {children}
      <Footer />
    </>
  );
}
