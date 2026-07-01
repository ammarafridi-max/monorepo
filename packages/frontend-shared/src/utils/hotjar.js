import Hotjar from '@hotjar/browser';

// Per-app Hotjar site id (inlined at build from each app's .env). Version is the
// Hotjar snippet version, currently 6 for all sites.
const HOTJAR_ID = process.env.NEXT_PUBLIC_HOTJAR_ID;
const HOTJAR_VERSION = 6;

const isProduction = process.env.NODE_ENV === 'production';

const isAdminPath = () =>
  typeof window !== 'undefined' &&
  window.location.pathname.startsWith('/admin');

// Same gate as GA4 (see analytics.js): production only, never on /admin.
const shouldTrackHotjar = () => isProduction && !isAdminPath();

// Init exactly once per page load. Unlike ReactGA, Hotjar records sessions, so a
// double init would risk duplicate recordings — guard it.
let initialized = false;

export function initializeHotjar() {
  if (initialized || !HOTJAR_ID || !shouldTrackHotjar()) return;
  Hotjar.init(Number(HOTJAR_ID), HOTJAR_VERSION);
  initialized = true;
}
