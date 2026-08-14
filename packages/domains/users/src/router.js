import { Router } from 'express';

const RATE_MAX = 5;
const RATE_WINDOW_MS = 60 * 60 * 1000;
const rateBuckets = new Map();

setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateBuckets.entries()) {
    if (now > entry.resetAt) rateBuckets.delete(key);
  }
}, 10 * 60 * 1000).unref?.();

function hit(key) {
  const now = Date.now();
  const entry = rateBuckets.get(key);
  if (!entry || now > entry.resetAt) {
    rateBuckets.set(key, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return true;
  }
  entry.count += 1;
  return entry.count <= RATE_MAX;
}

function magicLinkRateLimiter(req, res, next) {
  const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip || 'unknown';
  const email = String(req.body?.email || '').trim().toLowerCase() || 'no-email';
  const ipOk = hit(`ip:${ip}`);
  const emailOk = hit(`email:${email}`);
  if (!ipOk || !emailOk) {
    return res.status(429).json({ status: 'error', message: 'Too many sign-in link requests. Please try again later.' });
  }
  next();
}

export function createUserRouterFromParts({ controller, middleware }) {
  const router = Router();
  const { protect } = middleware;

  router.post('/register', controller.register);
  router.post('/login', controller.login);
  router.post('/logout', controller.logout);
  router.get('/verify-email/:token', controller.verifyEmail);
  router.post('/forgot-password', controller.forgotPassword);
  router.patch('/reset-password/:token', controller.resetPassword);
  router.post('/magic-link', magicLinkRateLimiter, controller.requestMagicLink);
  router.get('/magic-link/:token', controller.verifyMagicLink);

  router.use(protect);
  router.get('/me', controller.getProfile);
  router.patch('/me', controller.updateProfile);
  router.patch('/me/password', controller.updatePassword);
  router.delete('/me', controller.deleteAccount);

  return router;
}
