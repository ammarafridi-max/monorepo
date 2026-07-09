// Footer: brand, minimal in-page links, one contact. Dark ink surface to close
// the page (BRAND allows ink as a dark surface); bone type on it.
export default function Footer() {
  return (
    <footer className="footer">
      <div className="container footer__inner">
        <div className="footer__brand">
          <p className="footer__word">Headliner</p>
          <p className="footer__tag">Studio headshots from your selfies.</p>
        </div>

        <nav className="footer__nav" aria-label="Footer">
          <a href="#work">Samples</a>
          <a href="#how">How it works</a>
          <a href="#pricing">Pricing</a>
          <a href="#faq">FAQ</a>
          <a href="/login">Log in</a>
        </nav>

        <p className="footer__legal">
          <span>© 2026 Headliner</span>
          <a href="mailto:hello@headliner.studio">hello@headliner.studio</a>
        </p>
      </div>
    </footer>
  );
}
