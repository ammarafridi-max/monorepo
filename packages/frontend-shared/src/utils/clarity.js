const CLARITY_PROJECT_ID = process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID;

const isProduction = process.env.NODE_ENV === "production";

const isAdminPath = () =>
  typeof window !== "undefined" &&
  window.location.pathname.startsWith("/admin");

const shouldTrackClarity = () => isProduction && !isAdminPath();

let initialized = false;

export function initializeClarity() {
  if (initialized || !CLARITY_PROJECT_ID || !shouldTrackClarity()) return;
  if (typeof window === "undefined" || typeof document === "undefined") return;

  window.clarity =
    window.clarity ||
    function (...args) {
      (window.clarity.q = window.clarity.q || []).push(args);
    };

  const tag = document.createElement("script");
  tag.async = true;
  tag.src = `https://www.clarity.ms/tag/${CLARITY_PROJECT_ID}`;
  document.head.appendChild(tag);

  initialized = true;
}
