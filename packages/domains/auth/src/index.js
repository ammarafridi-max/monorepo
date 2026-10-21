import AdminUserSchema from './admin-user.schema.js';
import AdminOtpSchema from './otp.schema.js';
import { createJwtUtils } from './jwt.js';
import { createAuthService } from './service.js';
import { createOtpService } from './otp.service.js';
import { createAdminAuthMiddleware } from './middleware.js';
import { createAuthController } from './controller.js';
import { createAuthRouterFromParts } from './router.js';
import * as validators from './validators.js';
import { getOrRegisterModel } from '@travel-suite/utils/model';

export { CSRF_HEADER, CSRF_HEADER_VALUE } from '@travel-suite/utils/csrf';


export function createAdminAuthMiddlewareFromDb({ db, jwtSecret }) {
  const AdminUser  = getOrRegisterModel(db, 'admin-user', AdminUserSchema);
  const { verifyToken } = createJwtUtils({ jwtSecret, jwtExpiresIn: '30d', cookieExpiresInDays: 30, nodeEnv: process.env.NODE_ENV ?? 'production' });
  return createAdminAuthMiddleware({ AdminUser, verifyToken });
}

export function createAuthRouter({ db, jwtSecret, jwtExpiresIn = '30d', cookieExpiresInDays = 30, nodeEnv = 'production', sendEmail, brandName = 'Admin', loginUrl, logger }) {
  const AdminUser  = getOrRegisterModel(db, 'admin-user', AdminUserSchema);
  const AdminOtp   = getOrRegisterModel(db, 'admin-otp', AdminOtpSchema);
  const jwtUtils   = createJwtUtils({ jwtSecret, jwtExpiresIn, cookieExpiresInDays, nodeEnv });
  const service    = createAuthService({ AdminUser });
  const otpService = createOtpService({ AdminUser, AdminOtp, sendEmail, brandName, loginUrl, logger });
  const middleware = createAdminAuthMiddleware({ AdminUser, verifyToken: jwtUtils.verifyToken });
  const controller = createAuthController({ service, otpService, jwtUtils });
  const router     = createAuthRouterFromParts({ controller, middleware, validators, db, logger });

  return { router, middleware, AdminUser, AdminOtp, otpEnabled: otpService.enabled };
}
