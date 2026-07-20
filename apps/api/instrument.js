import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import dotenv from 'dotenv';
import * as Sentry from '@sentry/node';

/**
 * Sentry bootstrap for the API. Imported FIRST in server.js (before express), so
 * the SDK is initialised before anything it needs to instrument.
 *
 * We load the root .env HERE, because this module runs before server.js's own
 * dotenv.config() (ESM evaluates imported modules before the importer's body), so
 * SENTRY_DSN would otherwise be unset. Same root-.env pattern as the services.
 *
 * NO DSN => Sentry is never initialised and every Sentry.* call is a safe no-op,
 * so local dev without a DSN boots and runs exactly as before.
 */
dotenv.config({
  path: resolve(
    dirname(fileURLToPath(import.meta.url)),
    `../../.env.${process.env.NODE_ENV || 'development'}`,
  ),
});

const dsn = process.env.SENTRY_DSN;
export const sentryEnabled = Boolean(dsn);

// Keep customer data out of error reports. We want stack traces, not faces:
// redact emails and uploaded-image URLs anywhere they leak into a message.
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
  // Drop the HTTP request body / cookies / auth header entirely (we never need
  // customer payloads to debug a stack trace); keep method + path for context.
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
    // Errors are the goal here; tracing is opt-in and off by default.
    tracesSampleRate: Number(process.env.SENTRY_TRACES_SAMPLE_RATE) || 0,
    sendDefaultPii: false,
    beforeSend: scrubEvent,
  });
  console.log(
    `[api] Sentry error tracking enabled (${process.env.SENTRY_ENVIRONMENT || process.env.NODE_ENV || 'development'})`,
  );
} else {
  console.log('[api] SENTRY_DSN unset: error tracking disabled');
}

/** Report a handled error. Safe no-op when Sentry is disabled. */
export function captureError(err, context) {
  if (!sentryEnabled) return;
  Sentry.captureException(err, context ? { extra: context } : undefined);
}

export { Sentry };
