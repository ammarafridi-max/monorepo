import Link from 'next/link';
import './globals.css';

export const metadata = { title: 'Page not found. Picturesk.ai', robots: { index: false, follow: false } };

export default function NotFound() {
  return (
    <main className="page notfound">
      <div className="container container--narrow">
        <Link className="brand notfound__brand" href="/" aria-label="Picturesk.ai home">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="brand__logo" src="/wordmark.png" alt="Picturesk" width={746} height={114} />
        </Link>
        <p className="eyebrow">404</p>
        <h1 className="display">That page has moved on.</h1>
        <p className="lede muted">
          The link is wrong or the page no longer exists. Everything we make from your selfies is below.
        </p>
        <div className="hero__actions">
          <Link className="btn btn--primary" href="/ai-headshot-generator">
            Professional headshots <span className="btn__price">from $9</span>
          </Link>
          <Link className="btn btn--link" href="/ai-dating-photos">
            Dating photos
          </Link>
        </div>
        <p className="formnote formnote--left">
          Looking for something else? Try the <Link href="/faq">FAQ</Link>, the <Link href="/blog">blog</Link>, or{' '}
          <Link href="/contact">contact us</Link>.
        </p>
      </div>
    </main>
  );
}
