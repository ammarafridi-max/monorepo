'use client';

import Footer from './Footer';
import Container from './Container';
import ProfileMenu from './ProfileMenu';
import { FiUserPlus } from 'react-icons/fi';

/**
 * The customer-facing chrome (topbar + footer). Mounted by the (site) route group
 * only, so the /admin subtree never renders it. `authed` is derived server-side
 * (the session cookie) and passed down so this client component stays serializable.
 *
 * The "Forest & Gold" identity is now the global brand, so the green chrome applies
 * to every customer route. The wordmark is text, not the stored logo.png.
 *
 * The nav ends with the one primary action on the site, so a visitor can start the
 * funnel from any page without scrolling back to a section CTA. It shows for signed
 * in customers too: buying again is a normal thing to do.
 */
export default function SiteChrome({ authed, email, children }) {
  return (
    <>
      <header className="topbar">
        <Container>
          <div className="topbar__inner">
            <a className="brand" href="/" aria-label="Picturesk.ai home">
              <span className="brand__word">Picturesk</span>
            </a>
            <nav className="nav">
              <a className="navlink" href="/blog">
                Blog
              </a>
              {authed ? (
                <ProfileMenu email={email} />
              ) : (
                <span className="nav-auth">
                  <a className="navlink" href="/signup">
                    <FiUserPlus aria-hidden="true" />
                    Sign Up
                  </a>
                  <span className="nav-auth__sep" aria-hidden="true">
                    /
                  </span>
                  <a className="navlink" href="/login">
                    Log in
                  </a>
                </span>
              )}
              <a className="navcta" href="/ai-headshot-generator/select">
                Get my headshots
              </a>
            </nav>
          </div>
        </Container>
      </header>
      {children}
      <Footer />
    </>
  );
}
