import Hotjar from "@hotjar/browser";

const HOTJAR_ID = process.env.NEXT_PUBLIC_HOTJAR_ID;
const HOTJAR_VERSION = 6;

const isProduction = process.env.NODE_ENV === "production";

const isAdminPath = () =>
  typeof window !== "undefined" &&
  window.location.pathname.startsWith("/admin");

const shouldTrackHotjar = () => isProduction && !isAdminPath();

let initialized = false;

export function initializeHotjar() {
  if (initialized || !HOTJAR_ID || !shouldTrackHotjar()) return;
  Hotjar.init(Number(HOTJAR_ID), HOTJAR_VERSION);
  initialized = true;
}
