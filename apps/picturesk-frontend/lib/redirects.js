// The `next` a sign-in flow returns to. Only a same-site path is honoured, so a
// crafted link cannot bounce a fresh session to another origin.
export function safeNext(value, fallback = '/account') {
  const v = typeof value === 'string' ? value : '';
  return v.startsWith('/') && !v.startsWith('//') && !v.includes('\\') ? v : fallback;
}
