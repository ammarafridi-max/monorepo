// Scripts load through the shared AnalyticsInit once the visitor consents (components/Analytics.js).
// Clarity records session replays, so the face photos and email must stay masked in the Clarity project settings.
export function analyticsEnabled() {
  return Boolean(
    process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID ||
      process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID ||
      process.env.NEXT_PUBLIC_META_PIXEL_ID,
  );
}

/**
 * The complete set of funnel events. Keeping them named here (rather than inline
 * strings) keeps the funnel legible and prevents typos drifting the dashboard.
 * NONE of these carry PII: no email, no image data, no order contents.
 */
export const EVENTS = Object.freeze({
  LANDING_VIEW: 'landing_view',
  SELECT_VIEW: 'select_view',
  UPLOAD_STARTED: 'upload_started',
  UPLOAD_COMPLETED: 'upload_completed',
  PAYMENT_VIEW: 'payment_view',
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
  if (typeof window.gtag === 'function') {
    try {
      window.gtag('event', event, props || {});
    } catch {}
  }
  // Clarity custom event: tags the current session replay so funnel steps can be
  // filtered/segmented in Clarity (e.g. watch only sessions that reached checkout).
  if (typeof window.clarity === 'function') {
    try {
      window.clarity('event', event);
    } catch {}
  }
}
