const META_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID;

const isProduction = process.env.NODE_ENV === "production";

const isAdminPath = () =>
  typeof window !== "undefined" &&
  window.location.pathname.startsWith("/admin");

let initialized = false;

// fbevents.js tracks history changes itself, so App Router navigations get a PageView without manual route tracking.
export function initializeMetaPixel() {
  if (initialized || !META_PIXEL_ID || !isProduction || isAdminPath()) return;
  if (typeof window === "undefined" || typeof document === "undefined") return;

  if (!window.fbq) {
    const n = function (...args) {
      if (n.callMethod) n.callMethod(...args);
      else n.queue.push(args);
    };
    window.fbq = n;
    if (!window._fbq) window._fbq = n;
    n.push = n;
    n.loaded = true;
    n.version = "2.0";
    n.queue = [];

    const tag = document.createElement("script");
    tag.async = true;
    tag.src = "https://connect.facebook.net/en_US/fbevents.js";
    document.head.appendChild(tag);
  }

  window.fbq("init", META_PIXEL_ID);
  window.fbq("track", "PageView");
  initialized = true;
}

function fbq(...args) {
  initializeMetaPixel();
  if (typeof window !== "undefined" && typeof window.fbq === "function") {
    window.fbq(...args);
  }
}

function readCookie(name) {
  if (typeof document === "undefined") return undefined;
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : undefined;
}

export function getMetaBrowserIds() {
  return { fbp: readCookie("_fbp"), fbc: readCookie("_fbc") };
}

export function pixelEvent(event, data = {}, eventId) {
  if (eventId) fbq("track", event, data, { eventID: eventId });
  else fbq("track", event, data);
}

export function pixelCustomEvent(event, data = {}) {
  fbq("trackCustom", event, data);
}

export function pixelLead({ currency = "AED", value = 0 } = {}) {
  pixelEvent("Lead", { currency, value });
}

export function pixelViewContent({
  currency = "AED",
  value = 0,
  numItems = 0,
} = {}) {
  pixelEvent("ViewContent", { currency, value, num_items: numItems });
}

export function pixelInitiateCheckout({
  currency = "AED",
  value = 0,
  numItems = 1,
} = {}) {
  pixelEvent("InitiateCheckout", { currency, value, num_items: numItems });
}

// eventId must match the server-side Conversions API event so Meta counts the sale once.
export function pixelPurchase({ currency = "AED", value = 0, eventId } = {}) {
  const storageKey = eventId ? `meta:purchase:${eventId}` : null;
  try {
    if (storageKey && window.localStorage.getItem(storageKey) === "1") return;
  } catch {}

  pixelEvent("Purchase", { currency, value }, eventId);

  try {
    if (storageKey && typeof window.fbq === "function") {
      window.localStorage.setItem(storageKey, "1");
    }
  } catch {}
}
