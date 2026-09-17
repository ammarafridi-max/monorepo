import * as Sentry from '@sentry/node';

/**
 * Shared Sentry bootstrap for every backend. Import it first in server.js, before
 * express, so the SDK is initialised before anything it may want to instrument.
 * No SENTRY_DSN means nothing is initialised and every call here is a no-op, so
 * local dev boots exactly as before.
 */

const dsn = process.env.SENTRY_DSN;
export const sentryEnabled = Boolean(dsn);

const EMAIL_RE = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
const redact = (value) => (typeof value === 'string' ? value.replace(EMAIL_RE, '[email]') : value);

// Stack traces, not customer payloads: drop bodies, cookies and auth headers,
// and scrub emails from anything that reaches the message.
function scrubEvent(event) {
  if (event.request) {
    delete event.request.data;
    delete event.request.cookies;
    if (event.request.headers) {
      delete event.request.headers.authorization;
      delete event.request.headers.cookie;
    }
  }
  if (event.message) event.message = redact(event.message);
  for (const ex of event.exception?.values ?? []) ex.value = redact(ex.value);
  for (const b of event.breadcrumbs ?? []) b.message = redact(b.message);
  for (const k of Object.keys(event.extra ?? {})) event.extra[k] = redact(event.extra[k]);
  return event;
}

const environment = process.env.SENTRY_ENVIRONMENT || process.env.NODE_ENV || 'development';
const service = process.env.SENTRY_SERVICE || process.env.FLY_APP_NAME || 'backend';

if (sentryEnabled) {
  Sentry.init({
    dsn,
    environment,
    release: process.env.SENTRY_RELEASE || undefined,
    tracesSampleRate: Number(process.env.SENTRY_TRACES_SAMPLE_RATE) || 0,
    sendDefaultPii: false,
    initialScope: { tags: { service } },
    beforeSend: scrubEvent,
  });
  console.log(`[${service}] Sentry error tracking enabled (${environment})`);
} else {
  console.log(`[${service}] SENTRY_DSN unset: error tracking disabled`);
}

/** Report a handled error. Safe no-op when Sentry is disabled. */
export function captureError(err, context) {
  if (!sentryEnabled) return;
  Sentry.captureException(err, context ? { extra: context } : undefined);
}

/** Mount after every route and before the app's own error handler. */
export function setupSentryErrorHandler(app) {
  if (sentryEnabled) Sentry.setupExpressErrorHandler(app);
}

export { Sentry };
