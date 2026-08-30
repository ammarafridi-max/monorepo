import rateLimit from 'express-rate-limit';

/**
 * Per-IP rate limiting for the public API. Three tiers:
 *   - a generous GLOBAL backstop on every (non-webhook) route, sized above the
 *     success page's poll rate so normal use is never throttled;
 *   - STRICT limiters on POST /uploads/presign and POST /checkout, which cost
 *     storage and money and are the real abuse targets.
 *
 * The Stripe webhook is deliberately NOT covered (it is mounted before these in
 * server.js): Stripe can burst retries and must never be throttled.
 *
 * Keying: express-rate-limit keys on req.ip, which is only the true client IP if
 * Express is told how many proxies to trust (see app.set('trust proxy', ...) in
 * server.js). Behind Fly.io that is 1 hop. Getting it wrong is a real footgun:
 * trust too much and the forwarded header is spoofable (one attacker rotates it to
 * dodge the limit); trust too little and everyone shares the proxy IP and gets
 * limited as one. A specific hop count, not `true`, is the safe setting.
 */

function num(v, fallback) {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

/** Config from env, with defaults tuned for a small single-region deployment. */
export const RATE_LIMITS = Object.freeze({
  windowMs: num(process.env.RATE_LIMIT_WINDOW_MS, 15 * 60 * 1000), // 15 min
  globalMax: num(process.env.RATE_LIMIT_MAX, 600), // ~40/min: well above polling
  presignMax: num(process.env.RATE_LIMIT_PRESIGN_MAX, 20),
  checkoutMax: num(process.env.RATE_LIMIT_CHECKOUT_MAX, 10),
});

// A short, clean 429 body. No internals, no IPs, no stack.
const TOO_MANY = Object.freeze({
  error: 'too_many_requests',
  message: 'Too many requests. Please slow down and try again shortly.',
});

/**
 * Build the three limiters from a config object. A factory (not module-level
 * singletons) so tests can construct tiny limits without 600 requests.
 * @param {typeof RATE_LIMITS} cfg
 */
export function createRateLimiters(cfg = RATE_LIMITS) {
  const make = (limit) =>
    rateLimit({
      windowMs: cfg.windowMs,
      limit,
      standardHeaders: 'draft-7', // RateLimit-* headers so clients can back off
      legacyHeaders: false,
      message: TOO_MANY, // object => sent as JSON with status 429
    });

  return {
    globalLimiter: make(cfg.globalMax),
    presignLimiter: make(cfg.presignMax),
    checkoutLimiter: make(cfg.checkoutMax),
  };
}
