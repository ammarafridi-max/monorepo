const OPENAI_PIXEL_ID = process.env.NEXT_PUBLIC_OPENAI_PIXEL_ID;

const isProduction = process.env.NODE_ENV === "production";

const isAdminPath = () =>
  typeof window !== "undefined" &&
  window.location.pathname.startsWith("/admin");

let initialized = false;

export function initializeOpenAIPixel() {
  if (initialized || !OPENAI_PIXEL_ID || !isProduction || isAdminPath()) return;
  if (typeof window === "undefined" || typeof document === "undefined") return;

  if (!window.oaiq) {
    const q = function (...args) {
      q.q.push(args);
    };
    q.q = [];
    window.oaiq = q;

    const tag = document.createElement("script");
    tag.async = true;
    tag.src = "https://bzrcdn.openai.com/sdk/oaiq.min.js";
    document.head.appendChild(tag);
  }

  window.oaiq("init", { pixelId: OPENAI_PIXEL_ID });
  window.oaiq("measure", "page_viewed", { type: "contents" });
  initialized = true;
}

function oaiq(...args) {
  initializeOpenAIPixel();
  if (typeof window !== "undefined" && typeof window.oaiq === "function") {
    window.oaiq(...args);
  }
}

function readCookie(name) {
  if (typeof document === "undefined") return undefined;
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : undefined;
}

export function getOpenAIBrowserIds() {
  return { oppref: readCookie("__oppref"), obref: readCookie("__obref") };
}

const toMinorUnits = (value) => Math.round(Number(value || 0) * 100);

export function openaiCheckoutStarted({ currency = "AED", value = 0 } = {}) {
  oaiq("measure", "checkout_started", { type: "contents", amount: toMinorUnits(value), currency });
}

export function openaiOrderCreated({ currency = "AED", value = 0, eventId } = {}) {
  const storageKey = eventId ? `openai:order:${eventId}` : null;
  try {
    if (storageKey && window.localStorage.getItem(storageKey) === "1") return;
  } catch {}

  oaiq(
    "measure",
    "order_created",
    { type: "contents", amount: toMinorUnits(value), currency },
    eventId ? { event_id: eventId } : undefined,
  );

  try {
    if (storageKey && typeof window.oaiq === "function") {
      window.localStorage.setItem(storageKey, "1");
    }
  } catch {}
}

export function openaiLeadCreated({ eventId } = {}) {
  oaiq("measure", "lead_created", { type: "customer_action" }, eventId ? { event_id: eventId } : undefined);
}
