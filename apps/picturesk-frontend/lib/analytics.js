// Funnel analytics: GA4 for counts and Microsoft Clarity for session replay. Both
// set cookies, so components/Analytics.js loads them only after the visitor opts
// in. Enabled ONLY when the matching NEXT_PUBLIC_* id is set at build time; unset
// means no script loads and every track() below is a no-op, so local dev stays
// clean with nothing phoning home.

// GA4 measurement ID (G-XXXXXXXXXX). track() fans out to whichever script is present.
export const GA_ID = process.env.NEXT_PUBLIC_GA_ID || '';

// Microsoft Clarity project id. Same opt-in, build-time-inlined shape as GA4.
// Clarity is session replay + heatmaps, NOT just counts: enabling it records
// REPLAYS of real sessions, so anything sensitive (the face photos and email on
// the upload/capture/pay pages) must be masked in the Clarity project's privacy
// settings (and/or via data-clarity-mask on those elements).
export const CLARITY_ID = process.env.NEXT_PUBLIC_CLARITY_ID || '';

export function gaEnabled() {
  return Boolean(GA_ID);
}

export function clarityEnabled() {
  return Boolean(CLARITY_ID);
}

export function analyticsEnabled() {
  return gaEnabled() || clarityEnabled();
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
