// Site footer: brand + grouped links + contact, on a dark ink surface (BRAND
// allows ink as a dark surface). Rendered once from the root layout, so links are
// absolute paths (the home anchors point at /#section) and work from any page.
export default function Footer() {
  return (
    <footer className="footer">
      <div className="container footer__inner">
        <div className="footer__brand">
          <p className="footer__word">Picturesk.ai</p>
          <p className="footer__tag">Studio headshots from your selfies.</p>
        </div>

        <nav className="footer__cols" aria-label="Footer">
          <div className="footer__col">
            <p className="footer__coltitle">Product</p>
            <a href="/#work">Samples</a>
            <a href="/#how">How it works</a>
            <a href="/#pricing">Pricing</a>
            <a href="/login">Log in</a>
          </div>

          <div className="footer__col">
            <p className="footer__coltitle">Support</p>
            <a href="/contact">Contact</a>
            <a href="/faq">FAQ</a>
          </div>

          <div className="footer__col">
            <p className="footer__coltitle">Legal</p>
            <a href="/privacy">Privacy</a>
            <a href="/terms">Terms</a>
            <a href="/refunds">Refunds</a>
          </div>
        </nav>

        <p className="footer__legal">
          <span>© 2026 Picturesk.ai</span>
          <a href="mailto:hello@picturesk.ai">hello@picturesk.ai</a>
        </p>
      </div>
    </footer>
  );
}
