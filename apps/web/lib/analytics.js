// Privacy-light, cookieless funnel analytics via Plausible.
//
// Why Plausible: cookieless by default (no consent banner, no personal data, no
// cross-site profile), a tiny (~1 KB) script, and simple custom events. PostHog
// can run cookieless too but is heavier and profile-oriented; for a five-event
// launch funnel Plausible is the lighter, privacy-first fit.
//
// Enabled ONLY when NEXT_PUBLIC_ANALYTICS_DOMAIN is set. Unset => no script is
// loaded (see app/Analytics.js) and every track() below is a no-op, so local dev
// stays clean with nothing phoning home.

export const ANALYTICS_DOMAIN = process.env.NEXT_PUBLIC_ANALYTICS_DOMAIN || '';
export const ANALYTICS_SRC =
  process.env.NEXT_PUBLIC_ANALYTICS_SRC || 'https://plausible.io/js/script.js';

// GA4 measurement ID (G-XXXXXXXXXX). Loaded only when set at build time, same
// opt-in shape as Plausible. Both can run together; track() fans out to whichever
// script is present.
export const GA_ID = process.env.NEXT_PUBLIC_GA_ID || '';

export function plausibleEnabled() {
  return Boolean(ANALYTICS_DOMAIN);
}

export function gaEnabled() {
  return Boolean(GA_ID);
}

export function analyticsEnabled() {
  return plausibleEnabled() || gaEnabled();
}

/**
 * The complete set of funnel events. Keeping them named here (rather than inline
 * strings) keeps the funnel legible and prevents typos drifting the dashboard.
 * NONE of these carry PII: no email, no image data, no order contents.
 */
export const EVENTS = Object.freeze({
  LANDING_VIEW: 'landing_view',
  UPLOAD_STARTED: 'upload_started',
  UPLOAD_COMPLETED: 'upload_completed',
  CHECKOUT_STARTED: 'checkout_started',
  PURCHASE_COMPLETED: 'purchase_completed',
  QUALITY_GATE_FAILED: 'quality_gate_failed', // optional drop-off signal
});

/**
 * Fire a funnel event. Safe everywhere: no-op during SSR, no-op when the script
 * is not loaded (analytics disabled). Never pass PII in props.
 */
export function track(event, props) {
  if (typeof window === 'undefined') return;
  // Analytics must never break the app: guard each sink independently.
  if (typeof window.plausible === 'function') {
    try {
      window.plausible(event, props ? { props } : undefined);
    } catch {}
  }
  if (typeof window.gtag === 'function') {
    try {
      window.gtag('event', event, props || {});
    } catch {}
  }
}
