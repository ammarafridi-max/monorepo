import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { AdminUser } from '@picturesk/shared';
import { AppError, adminErrorHandler } from './errors.js';
import { createJwtUtils } from './jwt.js';
import { createAuthService } from './authService.js';
import { createAdminAuthMiddleware } from './authMiddleware.js';
import { createAuthController } from './authController.js';
import { loginSchema, updatePasswordSchema, updateCurrentAdminSchema } from './validators.js';

/** Turn a validator function into middleware that normalizes/replaces req.body. */
function validate(schema) {
  return (req, _res, next) => {
    try {
      req.body = schema(req.body);
      next();
    } catch (err) {
      next(err instanceof AppError ? err : new AppError(err.message || 'Invalid request data', 400));
    }
  };
}

// Brute-force guard on login. Counts only FAILED attempts (skipSuccessfulRequests),
// so a legitimately busy admin is never locked out. On top of the server's global limiter.
const loginLimiter = rateLimit({
  max: 30,
  windowMs: 15 * 60 * 1000,
  skipSuccessfulRequests: true,
  message: { status: 'fail', message: 'Too many login attempts. Please try again in 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Build the admin auth subsystem: registers nothing new (AdminUser is a shared
 * model on the default mongoose connection), wires the layers, and returns the
 * mounted router plus the `protect`/`restrictTo` guards for reuse by Phase B
 * data routes (orders, stats, customers) and later admin-user CRUD.
 *
 * Routes (mounted by the caller at /auth):
 *   POST /login            loginLimiter, validate(loginSchema)      -> login (sets cookie)
 *   POST /logout           -> logout (clears cookie)
 *   GET  /me               protect                                  -> current admin
 *   PATCH /me              protect, validate(updateCurrentAdmin)    -> update own name/email
 *   PATCH /update-password protect, validate(updatePassword)        -> change own password
 *
 * @param {{ jwtSecret: string, jwtExpiresIn: string, cookieExpiresInDays: number, nodeEnv: string }} config
 * @returns {{ router: import('express').Router, protect: Function, restrictTo: Function }}
 */
export function createAdminAuth(config) {
  const jwtUtils = createJwtUtils(config);
  const service = createAuthService({ AdminUser });
  const { protect, restrictTo } = createAdminAuthMiddleware({ AdminUser, verifyToken: jwtUtils.verifyToken });
  const controller = createAuthController({ service, jwtUtils });

  const router = Router();

  router.post('/login', loginLimiter, validate(loginSchema), controller.login);
  router.post('/logout', controller.logout);
  router.get('/logout', controller.logout);

  router.get('/me', protect, controller.currentUserInfo);
  router.patch('/me', protect, validate(updateCurrentAdminSchema), controller.updateCurrentUser);
  router.patch('/update-password', protect, validate(updatePasswordSchema), controller.updatePassword);

  // Router-scoped error handler so admin AppErrors render as JSON without
  // touching the rest of the server's per-route try/catch style.
  router.use(adminErrorHandler);

  return { router, protect, restrictTo };
}
