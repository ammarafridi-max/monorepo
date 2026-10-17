import rateLimit from 'express-rate-limit';


function num(v, fallback) {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

export const RATE_LIMITS = Object.freeze({
  windowMs: num(process.env.RATE_LIMIT_WINDOW_MS, 15 * 60 * 1000), 
  globalMax: num(process.env.RATE_LIMIT_MAX, 600), 
  presignMax: num(process.env.RATE_LIMIT_PRESIGN_MAX, 150),
  gateMax: num(process.env.RATE_LIMIT_GATE_MAX, 150),
  checkoutMax: num(process.env.RATE_LIMIT_CHECKOUT_MAX, 10),
});

const TOO_MANY = Object.freeze({
  error: 'too_many_requests',
  message: 'Too many requests. Please slow down and try again shortly.',
});

export function createRateLimiters(cfg = RATE_LIMITS) {
  const make = (limit) =>
    rateLimit({
      windowMs: cfg.windowMs,
      limit,
      standardHeaders: 'draft-7', 
      legacyHeaders: false,
      message: TOO_MANY, 
    });

  return {
    globalLimiter: make(cfg.globalMax),
    presignLimiter: make(cfg.presignMax),
    gateLimiter: make(cfg.gateMax),
    checkoutLimiter: make(cfg.checkoutMax),
  };
}
