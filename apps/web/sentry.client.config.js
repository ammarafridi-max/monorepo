import * as Sentry from '@sentry/nextjs';
import { scrubEvent } from './lib/sentryScrub';

// Browser Sentry. The client DSN must be public (inlined at build), so it uses
// NEXT_PUBLIC_SENTRY_DSN. No DSN => no init => no-op (and, since we only wrap the
// build with Sentry when a DSN is set, this file is not even bundled otherwise).
const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    environment:
      process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT || process.env.NODE_ENV || 'development',
    // Errors only: no performance tracing, no session replay, to keep the client
    // bundle and network footprint minimal.
    tracesSampleRate: 0,
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 0,
    sendDefaultPii: false,
    beforeSend: scrubEvent,
  });
}
