'use client';

import { useEffect } from 'react';
import * as Sentry from '@sentry/nextjs';
import './globals.css';
import Container from '../components/Container';

export default function GlobalError({ error, reset }) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="en">
      <body>
        <main className="page">
          <Container size="narrow">
            <h1 className="display">Something went wrong.</h1>
            <p className="lede muted">
              An unexpected error stopped this page from loading. Please try again.
            </p>
            <button className="btn btn--primary" type="button" onClick={() => reset()}>
              Try again
            </button>
          </Container>
        </main>
      </body>
    </html>
  );
}
