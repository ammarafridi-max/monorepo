import * as Sentry from '@sentry/node';


const ROLE = process.argv[1]?.endsWith('worker.js') ? 'worker' : 'api';

const dsn = process.env.SENTRY_DSN;
export const sentryEnabled = Boolean(dsn);

const R2_BASE = process.env.R2_PUBLIC_BASE_URL;
const EMAIL_RE = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
const IMG_URL_RE = /https?:\/\/[^\s"']*\/(uploads|training)\/[^\s"']*/g;

function redact(value) {
  if (typeof value !== 'string') return value;
  let out = value
    .replace(EMAIL_RE, '[email]')
    .replace(IMG_URL_RE, '[image-url]');
  if (R2_BASE) out = out.split(R2_BASE).join('[image-url]');
  return out;
}

function scrubEvent(event) {
  if (event.request) {
    delete event.request.data;
    delete event.request.cookies;
    if (event.request.headers) {
      delete event.request.headers.authorization;
      delete event.request.headers.cookie;
      delete event.request.headers['x-admin-token'];
    }
  }
  if (event.message) event.message = redact(event.message);
  for (const ex of event.exception?.values ?? []) ex.value = redact(ex.value);
  for (const b of event.breadcrumbs ?? []) b.message = redact(b.message);
  for (const k of Object.keys(event.extra ?? {}))
    event.extra[k] = redact(event.extra[k]);
  return event;
}

if (sentryEnabled) {
  Sentry.init({
    dsn,
    environment:
      process.env.SENTRY_ENVIRONMENT || process.env.NODE_ENV || 'development',
    release: process.env.SENTRY_RELEASE || undefined,
    tracesSampleRate: Number(process.env.SENTRY_TRACES_SAMPLE_RATE) || 0,
    sendDefaultPii: false,
    beforeSend: scrubEvent,
  });
  console.log(
    `[${ROLE}] Sentry error tracking enabled (${process.env.SENTRY_ENVIRONMENT || process.env.NODE_ENV || 'development'})`,
  );
} else {
  console.log(`[${ROLE}] SENTRY_DSN unset: error tracking disabled`);
}

export function captureError(err, context) {
  if (!sentryEnabled) return;
  Sentry.captureException(err, context ? { extra: context } : undefined);
}

export { Sentry };
