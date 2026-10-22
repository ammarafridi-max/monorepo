const DEFAULT_KEY = (req) => req.ip || 'unknown';

export function createFixedWindowLimiter({
  windowMs,
  max,
  keyOf = DEFAULT_KEY,
  onLimit = (_req, res) => res.status(429).json({ status: 'fail', message: 'Too many requests' }),
  maxEntries = 10_000,
}) {
  const hits = new Map();

  return (req, res, next) => {
    const now = Date.now();

    if (hits.size > maxEntries) {
      for (const [key, entry] of hits) if (entry.resetAt <= now) hits.delete(key);
    }

    const key = keyOf(req);
    const entry = hits.get(key);

    if (!entry || entry.resetAt <= now) {
      hits.set(key, { count: 1, resetAt: now + windowMs });
      return next();
    }

    entry.count += 1;
    if (entry.count > max) return onLimit(req, res);
    next();
  };
}
