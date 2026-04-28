import AdminUserSchema from './schema.js';
import { createJwtUtils } from './jwt.js';
import { createAuthService } from './service.js';
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

/**
 * Creates `protect` and `restrictTo` middleware — call this once in the thin shell,
 * then pass the result into every feature package that needs route protection.
 *
 * @param {{ db: import('mongoose').Connection, jwtSecret: string }} deps
 * @returns {{ protect: Function, restrictTo: Function }}
 */
export function createAdminAuthMiddlewareFromDb({ db, jwtSecret }) {
  const AdminUser  = getOrRegisterModel(db, 'admin-user', AdminUserSchema);
  const { verifyToken } = createJwtUtils({ jwtSecret, jwtExpiresIn: '7d', cookieExpiresInDays: 7, nodeEnv: process.env.NODE_ENV ?? 'production' });
  return createAdminAuthMiddleware({ AdminUser, verifyToken });
}

/**
 * Full auth factory — registers the AdminUser model, wires all layers,
 * and returns both the router (login/logout/me/update-password) and the
 * middleware object ({ protect, restrictTo }) for use in other feature packages.
 *
 * @param {{
 *   db: import('mongoose').Connection,
 *   jwtSecret: string,
 *   jwtExpiresIn?: string,
 *   cookieExpiresInDays?: number,
 *   nodeEnv?: string,
 * }} deps
 * @returns {{ router: import('express').Router, middleware: { protect: Function, restrictTo: Function } }}
 */
export function createAuthRouter({ db, jwtSecret, jwtExpiresIn = '7d', cookieExpiresInDays = 7, nodeEnv = 'production' }) {
  const AdminUser  = getOrRegisterModel(db, 'admin-user', AdminUserSchema);
  const jwtUtils   = createJwtUtils({ jwtSecret, jwtExpiresIn, cookieExpiresInDays, nodeEnv });
  const service    = createAuthService({ AdminUser });
  const middleware = createAdminAuthMiddleware({ AdminUser, verifyToken: jwtUtils.verifyToken });
  const controller = createAuthController({ service, jwtUtils });
  const router     = createAuthRouterFromParts({ controller, middleware, validators });

  return { router, middleware, AdminUser };
}
