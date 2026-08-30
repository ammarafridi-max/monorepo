import * as Sentry from '@sentry/nextjs';

// Next.js instrumentation hook. Loads the right Sentry config per runtime on
// server startup. Each config no-ops when its DSN is unset, so this is safe with
// no Sentry configured. Requires experimental.instrumentationHook in next.config.
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('./sentry.server.config');
  }
  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('./sentry.edge.config');
  }
}

// Captures errors thrown in server components / route handlers (Next 15's
// onRequestError hook; ignored on 14.2). A no-op until Sentry is initialised.
export const onRequestError = Sentry.captureRequestError;
