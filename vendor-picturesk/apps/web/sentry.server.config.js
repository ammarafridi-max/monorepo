import * as Sentry from '@sentry/nextjs';
import { scrubEvent } from './lib/sentryScrub';

// Server runtime (Node) Sentry for the web app. No DSN => no init => every
// Sentry call is a no-op, so local dev without a DSN runs unchanged.
const dsn = process.env.SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    environment: process.env.SENTRY_ENVIRONMENT || process.env.NODE_ENV || 'development',
    release: process.env.SENTRY_RELEASE || undefined,
    tracesSampleRate: Number(process.env.SENTRY_TRACES_SAMPLE_RATE) || 0,
    sendDefaultPii: false, // never attach cookies / headers / user data
    beforeSend: scrubEvent, // strip emails + image URLs
  });
}
