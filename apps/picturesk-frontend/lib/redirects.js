export function safeNext(value, fallback = '/account') {
  const v = typeof value === 'string' ? value : '';
  return v.startsWith('/') && !v.startsWith('//') && !v.includes('\\') ? v : fallback;
}
