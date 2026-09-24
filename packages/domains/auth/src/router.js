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
  max: 30,
  windowMs: 15 * 60 * 1000,
  skipSuccessfulRequests: true,
  message: 'Too many login attempts. Please try again in 15 minutes.',
  standardHeaders: true,
  legacyHeaders: false,
});

// A 6-digit code is a million guesses; the password limiter is not enough on
// its own, and the request side must not become a mail-bombing tool.
const otpRequestLimiter = rateLimit({
  max: 10,
  windowMs: 15 * 60 * 1000,
  message: 'Too many code requests. Please try again in 15 minutes.',
  standardHeaders: true,
  legacyHeaders: false,
});

const otpVerifyLimiter = rateLimit({
  max: 20,
  windowMs: 15 * 60 * 1000,
  skipSuccessfulRequests: true,
  message: 'Too many attempts. Please try again in 15 minutes.',
  standardHeaders: true,
  legacyHeaders: false,
});

export function createAuthRouterFromParts({ controller, middleware, validators }) {
  const { protect } = middleware;
  const { loginSchema, updatePasswordSchema, updateCurrentAdminSchema, otpRequestSchema, otpVerifySchema, forgotPasswordSchema, resetPasswordSchema } = validators;
  const router = Router();

  router.post('/login',  loginLimiter, validate(loginSchema), controller.login);
  router.post('/otp/request', otpRequestLimiter, validate(otpRequestSchema), controller.requestOtp);
  router.post('/otp/verify',  otpVerifyLimiter,  validate(otpVerifySchema),  controller.verifyOtp);

  router.post('/password/forgot', otpRequestLimiter, validate(forgotPasswordSchema), controller.forgotPassword);
  router.post('/password/reset',  otpVerifyLimiter,  validate(resetPasswordSchema),  controller.resetPassword);

  router.post('/logout', controller.logout);
  router.get('/logout',  controller.logout);

  router.get('/me',             protect, controller.currentUserInfo);
  router.patch('/me',           protect, validate(updateCurrentAdminSchema), controller.updateCurrentUser);
  router.patch('/update-password', protect, validate(updatePasswordSchema), controller.updatePassword);

  return router;
}
