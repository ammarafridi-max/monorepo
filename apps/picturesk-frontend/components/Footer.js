// Site footer: brand + grouped links + contact, on the deep-green Forest & Gold
// surface. Product links point at /ai-headshot-generator directly: linking to "/"
// sent every internal click through a 308 and left the canonical landing page with
// no direct inbound links at all. The brand is an ivory text wordmark (the stored logo.png is dark and
// would vanish on green). Rendered once from the root layout, so links are absolute
// paths (the home anchors point at /#section) and work from any page.
import Container from './Container';
import { services } from '../data/services';

export default function Footer() {
  return (
    <footer className="footer">
      <Container className="footer__inner">
        <div className="footer__brand">
          <p className="footer__word">Picturesk.ai</p>
          <p className="footer__tag">Headshots and dating photos from your selfies.</p>
        </div>

        <nav className="footer__cols" aria-label="Footer">
          {services.map((group) => (
            <div className="footer__col" key={group.id}>
              <p className="footer__coltitle">{group.label}</p>
              {group.pages.map((p) => (
                <a href={p.href} key={p.href}>
                  {p.label}
                </a>
              ))}
            </div>
          ))}
          <div className="footer__col">
            <p className="footer__coltitle">Support</p>
            <a href="/pricing">Pricing</a>
            <a href="/faq">FAQ</a>
            <a href="/contact">Contact</a>
            <a href="/login">Log in</a>
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
          <a href="mailto:info@picturesk.ai">info@picturesk.ai</a>
        </p>
      </Container>
    </footer>
  );
}
