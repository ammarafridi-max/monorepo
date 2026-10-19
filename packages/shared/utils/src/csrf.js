export const CSRF_HEADER = 'x-requested-by';
export const CSRF_HEADER_VALUE = 'web';

export function isStateChangingMethod(method) {
  const normalized = String(method ?? '').toUpperCase();
  return normalized !== 'GET' && normalized !== 'HEAD' && normalized !== 'OPTIONS';
}

export function hasCsrfHeader(req) {
  const value = req?.headers?.[CSRF_HEADER];
  return typeof value === 'string' && value.length > 0;
}
