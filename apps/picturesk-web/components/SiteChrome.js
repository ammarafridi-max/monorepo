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
 * to every customer route. The stored logo.png is dark and would vanish on the green
 * nav, so the brand renders as an ivory text wordmark.
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
            </nav>
          </div>
        </Container>
      </header>
      {children}
      <Footer />
    </>
  );
}
