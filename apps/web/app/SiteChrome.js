'use client';

import { usePathname } from 'next/navigation';
import Footer from './Footer';

/**
 * The customer-facing chrome (topbar + footer). Hidden on the /admin subtree, which
 * renders its own sidebar shell, so staff never see the buy-side nav. `authed` is
 * derived server-side (the session cookie) and passed down so this client component
 * stays serializable.
 */
export default function SiteChrome({ authed, children }) {
  const pathname = usePathname();
  if (pathname?.startsWith('/admin')) return <>{children}</>;

  return (
    <>
      <header className="topbar">
        <a className="brand" href="/" aria-label="Picturesk.ai home">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="brand__logo" src="/logo.png" alt="Picturesk.ai" />
        </a>
        <nav className="nav">
          {authed ? (
            <>
              <a className="navlink" href="/account">
                Account
              </a>
              <form action="/api/auth/logout" method="post">
                <button className="navlink navlink--button" type="submit">
                  Log out
                </button>
              </form>
            </>
          ) : (
            <a className="navlink" href="/login">
              Log in
            </a>
          )}
        </nav>
      </header>
      {children}
      <Footer />
    </>
  );
}
