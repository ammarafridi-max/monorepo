import AdminUserSchema from './schema.js';
import AdminOtpSchema from './otp.schema.js';
import { createJwtUtils } from './jwt.js';
import { createAuthService } from './service.js';
import { createOtpService } from './otp.service.js';
import { createAdminAuthMiddleware } from './middleware.js';
import { createAuthController } from './controller.js';
import { createAuthRouterFromParts } from './router.js';
import * as validators from './validators.js';

function getOrRegisterModel(conn, name, schema) {
  try {
    return conn.model(name);
  } catch {
    return conn.model(name, schema);
  }
}

export function createAdminAuthMiddlewareFromDb({ db, jwtSecret }) {
  const AdminUser  = getOrRegisterModel(db, 'admin-user', AdminUserSchema);
  const { verifyToken } = createJwtUtils({ jwtSecret, jwtExpiresIn: '30d', cookieExpiresInDays: 30, nodeEnv: process.env.NODE_ENV ?? 'production' });
  return createAdminAuthMiddleware({ AdminUser, verifyToken });
}

// sendEmail is optional. Without it the OTP endpoints answer 503 and password
// login is untouched, so a brand opts in by passing a mailer and nothing else.
export function createAuthRouter({ db, jwtSecret, jwtExpiresIn = '30d', cookieExpiresInDays = 30, nodeEnv = 'production', sendEmail, brandName = 'Admin', loginUrl, logger }) {
  const AdminUser  = getOrRegisterModel(db, 'admin-user', AdminUserSchema);
  const AdminOtp   = getOrRegisterModel(db, 'admin-otp', AdminOtpSchema);
  const jwtUtils   = createJwtUtils({ jwtSecret, jwtExpiresIn, cookieExpiresInDays, nodeEnv });
  const service    = createAuthService({ AdminUser });
  const otpService = createOtpService({ AdminUser, AdminOtp, sendEmail, brandName, loginUrl, logger });
  const middleware = createAdminAuthMiddleware({ AdminUser, verifyToken: jwtUtils.verifyToken });
  const controller = createAuthController({ service, otpService, jwtUtils });
  const router     = createAuthRouterFromParts({ controller, middleware, validators });

  return { router, middleware, AdminUser, AdminOtp, otpEnabled: otpService.enabled };
}
