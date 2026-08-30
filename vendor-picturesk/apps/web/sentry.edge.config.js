import * as Sentry from '@sentry/nextjs';
import { scrubEvent } from './lib/sentryScrub';

// Edge runtime Sentry (middleware / edge routes). No DSN => no-op.
const dsn = process.env.SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    environment: process.env.SENTRY_ENVIRONMENT || process.env.NODE_ENV || 'development',
    release: process.env.SENTRY_RELEASE || undefined,
    tracesSampleRate: Number(process.env.SENTRY_TRACES_SAMPLE_RATE) || 0,
    sendDefaultPii: false,
    beforeSend: scrubEvent,
  });
}
