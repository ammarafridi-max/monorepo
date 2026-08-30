// Redact customer PII from Sentry events before they leave the browser or server.
// We want stack traces, not customer faces: strip emails and uploaded-image URLs
// wherever they might appear. Env-free so it runs identically client and server.
const EMAIL_RE = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
const IMG_URL_RE = /https?:\/\/[^\s"']*\/(uploads|training)\/[^\s"']*/g;

function redact(value) {
  if (typeof value !== 'string') return value;
  return value.replace(EMAIL_RE, '[email]').replace(IMG_URL_RE, '[image-url]');
}

/** Sentry beforeSend hook. */
export function scrubEvent(event) {
  if (event.request) {
    delete event.request.data;
    delete event.request.cookies;
  }
  if (event.message) event.message = redact(event.message);
  for (const ex of event.exception?.values ?? []) ex.value = redact(ex.value);
  for (const b of event.breadcrumbs ?? []) if (b) b.message = redact(b.message);
  return event;
}
