export const REDACTED = '[redacted]';

const CREDENTIAL_PATH_PARENTS = new Set([
  'magic-link',
  'magiclink',
  'magic',
  'verify-email',
  'verify',
  'verification',
  'verify-token',
  'confirm',
  'confirm-email',
  'activate',
  'activation',
  'reset-password',
  'password-reset',
  'reset',
  'set-password',
  'new-password',
  'invite',
  'invitation',
  'accept-invite',
  'unsubscribe',
  'token',
  'tokens',
  'otp',
  'one-time',
  'session',
  'sessions',
  'impersonate',
]);

const SENSITIVE_KEY_WORDS = new Set([
  'token',
  'secret',
  'password',
  'passwd',
  'pwd',
  'pass',
  'auth',
  'authorization',
  'credential',
  'credentials',
  'otp',
  'code',
  'sig',
  'signature',
  'hash',
  'hmac',
  'jwt',
  'session',
  'key',
  'apikey',
  'nonce',
  'magic',
  'verify',
  'verification',
  'confirm',
  'activate',
  'activation',
  'invite',
  'invitation',
  'bearer',
]);

const OPAQUE = /^[A-Za-z0-9_-]{32,}$/;
const JWT_LIKE = /^[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}$/;

function looksLikeCredential(value) {
  if (!value) return false;
  if (JWT_LIKE.test(value)) return true;
  if (!OPAQUE.test(value)) return false;
  if (!/[-_]/.test(value)) return true;
  return /[a-z]/.test(value) && /[A-Z]/.test(value) && /[0-9]/.test(value);
}

function keyIsSensitive(key) {
  const words = String(key)
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .split(/[^A-Za-z0-9]+/);
  return words.some((word) => word && SENSITIVE_KEY_WORDS.has(word.toLowerCase()));
}

function redactPath(path) {
  const segments = path.split('/');
  return segments
    .map((segment, i) => {
      if (!segment) return segment;
      const parent = (segments[i - 1] || '').toLowerCase();
      if (CREDENTIAL_PATH_PARENTS.has(parent)) return REDACTED;
      if (looksLikeCredential(segment)) return REDACTED;
      return segment;
    })
    .join('/');
}

function redactQuery(query) {
  return query
    .split('&')
    .map((pair) => {
      if (!pair) return pair;
      const eq = pair.indexOf('=');
      if (eq === -1) return looksLikeCredential(pair) ? REDACTED : pair;
      const key = pair.slice(0, eq);
      const value = pair.slice(eq + 1);
      if (!value) return pair;
      if (keyIsSensitive(key) || looksLikeCredential(value)) return `${key}=${REDACTED}`;
      return pair;
    })
    .join('&');
}

export function redactUrl(url) {
  if (typeof url !== 'string' || url === '') return url;
  const hashAt = url.indexOf('#');
  const withoutHash = hashAt === -1 ? url : url.slice(0, hashAt);
  const queryAt = withoutHash.indexOf('?');
  const path = queryAt === -1 ? withoutHash : withoutHash.slice(0, queryAt);
  const query = queryAt === -1 ? '' : withoutHash.slice(queryAt + 1);
  const safePath = redactPath(path);
  if (queryAt === -1) return safePath;
  return `${safePath}?${redactQuery(query)}`;
}

export function redactRequestUrl(req) {
  return redactUrl(req?.originalUrl ?? req?.url ?? '');
}
