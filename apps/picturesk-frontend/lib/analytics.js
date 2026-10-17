// Clarity records session replays, so the face photos and email must stay masked in the Clarity project settings.
export function analyticsEnabled() {
  return Boolean(
    process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID ||
      process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID ||
      process.env.NEXT_PUBLIC_META_PIXEL_ID,
  );
}

export const EVENTS = Object.freeze({
  LANDING_VIEW: 'landing_view',
  SELECT_VIEW: 'select_view',
  UPLOAD_STARTED: 'upload_started',
  UPLOAD_COMPLETED: 'upload_completed',
  PAYMENT_VIEW: 'payment_view',
  CHECKOUT_STARTED: 'checkout_started',
  PURCHASE_COMPLETED: 'purchase_completed',
  QUALITY_GATE_FAILED: 'quality_gate_failed', 
});

export function track(event, props) {
  if (typeof window === 'undefined') return;
  if (typeof window.gtag === 'function') {
    try {
      window.gtag('event', event, props || {});
    } catch {}
  }
  if (typeof window.clarity === 'function') {
    try {
      window.clarity('event', event);
    } catch {}
  }
}
