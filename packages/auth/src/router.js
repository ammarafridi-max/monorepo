import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { AppError } from '@travel-suite/utils';

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

const loginLimiter = rateLimit({
  max: 10,
  windowMs: 15 * 60 * 1000,
  message: 'Too many login attempts. Please try again in 15 minutes.',
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Creates the auth Express router.
 * @param {{ controller, middleware: { protect }, validators: { loginSchema, updatePasswordSchema, updateCurrentAdminSchema } }} deps
 */
export function createAuthRouterFromParts({ controller, middleware, validators }) {
  const { protect } = middleware;
  const { loginSchema, updatePasswordSchema, updateCurrentAdminSchema } = validators;
  const router = Router();

  router.post('/login',  loginLimiter, validate(loginSchema), controller.login);
  router.post('/logout', controller.logout);
  router.get('/logout',  controller.logout);

  router.get('/me',             protect, controller.currentUserInfo);
  router.patch('/me',           protect, validate(updateCurrentAdminSchema), controller.updateCurrentUser);
  router.patch('/update-password', protect, validate(updatePasswordSchema), controller.updatePassword);

  return router;
}
