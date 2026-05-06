import Link from 'next/link';
import { ShieldOff, Home } from 'lucide-react';

export const metadata = {
  title: '404 — Page Not Found | TravelShield',
  description: 'The page you were looking for could not be found.',
};

/**
 * global-not-found.js
 *
 * Handles unmatched routes at the routing level (before any layout or page
 * renders). Because no layout is available at this level, this component
 * renders a self-contained page without importing Navbar/Footer to avoid
 * context/provider errors.
 */
export default function GlobalNotFound() {
  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: 'system-ui, sans-serif', backgroundColor: '#fff', color: '#111' }}>
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2rem',
            textAlign: 'center',
          }}
        >
          {/* Icon */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 72,
              height: 72,
              borderRadius: 16,
              backgroundColor: '#eff6ff',
              border: '1px solid #dbeafe',
              marginBottom: 24,
            }}
          >
            <ShieldOff size={32} color="#1d4ed8" />
          </div>

          {/* Status */}
          <p
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: '#2563eb',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              marginBottom: 12,
            }}
          >
            404 — Not Found
          </p>

          {/* Headline */}
          <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: 12 }}>
            Page not found
          </h1>

          {/* Body */}
          <p style={{ color: '#6b7280', maxWidth: 400, lineHeight: 1.6, marginBottom: 32 }}>
            We couldn&apos;t find the page you were looking for. It may have been
            moved or never existed.
          </p>

          {/* CTA */}
          <Link
            href="/"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              backgroundColor: '#1d4ed8',
              color: '#fff',
              fontWeight: 700,
              fontSize: 14,
              padding: '12px 24px',
              borderRadius: 12,
              textDecoration: 'none',
            }}
          >
            <Home size={15} />
            Back to Home
          </Link>
        </div>
      </body>
    </html>
  );
}
