'use client';

import { useEffect } from 'react';
import * as Sentry from '@sentry/nextjs';
import './globals.css';

// App Router global error boundary. Reports the render error to Sentry (a no-op
// when Sentry is not configured) and shows a calm, on-brand fallback. It replaces
// the root layout when it triggers, so it renders its own html/body.
export default function GlobalError({ error, reset }) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="en">
      <body>
        <main className="wrap">
          <h1 className="display">Something went wrong.</h1>
          <p className="lede muted">
            An unexpected error stopped this page from loading. Please try again.
          </p>
          <button className="btn btn--primary" type="button" onClick={() => reset()}>
            Try again
          </button>
        </main>
      </body>
    </html>
  );
}
