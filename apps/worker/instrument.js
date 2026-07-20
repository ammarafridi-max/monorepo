import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import dotenv from 'dotenv';
import * as Sentry from '@sentry/node';

/**
 * Sentry bootstrap for the worker. Imported FIRST in index.js so the SDK (and its
 * uncaught-exception / unhandled-rejection handlers) is armed before any pipeline
 * code runs. A crashed or failing worker in production surfaces here.
 *
 * Loads the root .env HERE, because this runs before index.js's own
 * dotenv.config() (ESM evaluates imports before the importer body).
 *
 * NO DSN => never initialised, every Sentry.* call is a safe no-op, so local dev
 * (and the test suite) runs exactly as before.
 */
dotenv.config({
  path: resolve(
    dirname(fileURLToPath(import.meta.url)),
    `../../.env.${process.env.NODE_ENV || 'development'}`,
  ),
});

const dsn = process.env.SENTRY_DSN;
export const sentryEnabled = Boolean(dsn);

// Keep customer data out of error reports: redact emails and uploaded-image URLs
// wherever they might leak into a message. We want stack traces, not faces.
const R2_BASE = process.env.R2_PUBLIC_BASE_URL;
const EMAIL_RE = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
const IMG_URL_RE = /https?:\/\/[^\s"']*\/(uploads|training)\/[^\s"']*/g;

function redact(value) {
  if (typeof value !== 'string') return value;
  let out = value.replace(EMAIL_RE, '[email]').replace(IMG_URL_RE, '[image-url]');
  if (R2_BASE) out = out.split(R2_BASE).join('[image-url]');
  return out;
}

function scrubEvent(event) {
  if (event.message) event.message = redact(event.message);
  for (const ex of event.exception?.values ?? []) ex.value = redact(ex.value);
  for (const b of event.breadcrumbs ?? []) b.message = redact(b.message);
  for (const k of Object.keys(event.extra ?? {})) event.extra[k] = redact(event.extra[k]);
  return event;
}

if (sentryEnabled) {
  Sentry.init({
    dsn,
    environment: process.env.SENTRY_ENVIRONMENT || process.env.NODE_ENV || 'development',
    release: process.env.SENTRY_RELEASE || undefined,
    tracesSampleRate: Number(process.env.SENTRY_TRACES_SAMPLE_RATE) || 0,
    sendDefaultPii: false,
    beforeSend: scrubEvent,
  });
  console.log(`[worker] Sentry error tracking enabled (${process.env.SENTRY_ENVIRONMENT || process.env.NODE_ENV || 'development'})`);
} else {
  console.log('[worker] SENTRY_DSN unset: error tracking disabled');
}

/**
 * Report a handled error. Pass only NON-PII context (orderId / jobId are Mongo /
 * queue ids, never the customer email or image URLs). Safe no-op when disabled.
 */
export function captureError(err, context) {
  if (!sentryEnabled) return;
  Sentry.captureException(err, context ? { extra: context } : undefined);
}

export { Sentry };
