import { Router } from 'express';
import rateLimit, { ipKeyGenerator } from 'express-rate-limit';

const HOUR_MS = 60 * 60 * 1000;

const normalizeEmail = (value) => String(value || '').trim().toLowerCase();

function ipLimiter({ windowMs, limit, message, skipSuccessfulRequests = false }) {
  return rateLimit({
    windowMs,
    limit,
    skipSuccessfulRequests,
    standardHeaders: true,
    legacyHeaders: false,
    message: { status: 'error', message },
  });
}

function emailLimiter({ windowMs, limit, message, scope }) {
  return rateLimit({
    windowMs,
    limit,
    standardHeaders: false,
    legacyHeaders: false,
    keyGenerator: (req) => {
      const email = normalizeEmail(req.body?.email);
      if (email) return `${scope}:email:${email}`;
      return `${scope}:ip:${req.ip ? ipKeyGenerator(req.ip) : 'unknown'}`;
    },
    message: { status: 'error', message },
  });
}

const TOO_MANY_SIGN_IN_LINKS = 'Too many sign-in link requests. Please try again later.';
const TOO_MANY_LOGINS = 'Too many sign-in attempts. Please try again in 15 minutes.';
const TOO_MANY_REGISTRATIONS = 'Too many accounts created from this network. Please try again later.';
const TOO_MANY_RESETS = 'Too many password reset requests. Please try again later.';
const TOO_MANY_TOKEN_ATTEMPTS = 'Too many attempts. Please try again later.';

const magicLinkIpLimiter = ipLimiter({ windowMs: HOUR_MS, limit: 5, message: TOO_MANY_SIGN_IN_LINKS });
const magicLinkEmailLimiter = emailLimiter({ windowMs: HOUR_MS, limit: 5, message: TOO_MANY_SIGN_IN_LINKS, scope: 'magic-link' });

const loginIpLimiter = ipLimiter({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  skipSuccessfulRequests: true,
  message: TOO_MANY_LOGINS,
});

const registerIpLimiter = ipLimiter({ windowMs: HOUR_MS, limit: 10, message: TOO_MANY_REGISTRATIONS });

const forgotPasswordIpLimiter = ipLimiter({ windowMs: HOUR_MS, limit: 5, message: TOO_MANY_RESETS });
const forgotPasswordEmailLimiter = emailLimiter({ windowMs: HOUR_MS, limit: 3, message: TOO_MANY_RESETS, scope: 'forgot-password' });

const tokenRedemptionLimiter = ipLimiter({ windowMs: HOUR_MS, limit: 30, message: TOO_MANY_TOKEN_ATTEMPTS });

export function createUserRouterFromParts({ controller, middleware }) {
  const router = Router();
  const { protect } = middleware;

  router.post('/register', registerIpLimiter, controller.register);
  router.post('/login', loginIpLimiter, controller.login);
  router.post('/logout', controller.logout);
  router.get('/verify-email/:token', tokenRedemptionLimiter, controller.verifyEmail);
  router.post('/forgot-password', forgotPasswordIpLimiter, forgotPasswordEmailLimiter, controller.forgotPassword);
  router.patch('/reset-password/:token', tokenRedemptionLimiter, controller.resetPassword);
  router.post('/magic-link', magicLinkIpLimiter, magicLinkEmailLimiter, controller.requestMagicLink);
  router.get('/magic-link/:token', tokenRedemptionLimiter, controller.verifyMagicLink);

  router.use(protect);
  router.get('/me', controller.getProfile);
  router.patch('/me', controller.updateProfile);
  router.patch('/me/password', controller.updatePassword);
  router.delete('/me', controller.deleteAccount);

  return router;
}
