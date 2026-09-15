import { Router } from 'express';
import { createAuthRouter } from '@travel-suite/auth';
import { createAdminUsersRouter } from '@travel-suite/admin-users';

/**
 * Admin subsystem composition root. Staff identity (the AdminUser model, login,
 * sessions, and staff CRUD) comes from the shared travel-suite domains; only the
 * ADMIN_TOKEN break-glass path below is Picturesk-specific.
 *
 * The session cookie is named `jwt` and the model registers as `admin-user`
 * (collection `admin-users`), because that is what the shared packages use.
 *
 * @param {{ db, jwtSecret, jwtExpiresIn, cookieExpiresInDays, nodeEnv, adminToken, isTokenAuthorized }} deps
 */
export function createAdminSubsystem({
  db,
  jwtSecret,
  jwtExpiresIn,
  cookieExpiresInDays,
  nodeEnv,
  adminToken,
  isTokenAuthorized,
}) {
  const authEnabled = Boolean(jwtSecret);

  let authRouter = null;
  let protect = null;
  let restrictTo = null;
  let AdminUser = null;

  if (authEnabled) {
    const built = createAuthRouter({ db, jwtSecret, jwtExpiresIn, cookieExpiresInDays, nodeEnv });
    authRouter = built.router;
    protect = built.middleware.protect;
    restrictTo = built.middleware.restrictTo;
    AdminUser = built.AdminUser;
  } else {
    authRouter = Router().use((_req, res) =>
      res.status(503).json({ status: 'error', message: 'admin auth disabled: set JWT_SECRET' })
    );
    // Role checks still work on the ADMIN_TOKEN identity when cookie auth is off.
    restrictTo = (...roles) => (req, res, next) =>
      req.user && roles.includes(req.user.role)
        ? next()
        : res.status(403).json({ status: 'fail', message: 'You do not have permission to perform this action' });
  }

  /**
   * Accepts EITHER the ADMIN_TOKEN break-glass header (for scripts and monitoring,
   * role 'admin') OR a valid admin cookie session. Sets req.user either way so the
   * downstream restrictTo() authorizes by role on both paths.
   */
  function guard(req, res, next) {
    if (adminToken && isTokenAuthorized(req)) {
      req.user = { role: 'admin', email: 'admin-token', username: 'admin-token', _id: null };
      return next();
    }
    if (protect) return protect(req, res, next);
    if (!adminToken) {
      return res.status(503).json({
        status: 'error',
        message: 'admin disabled: set JWT_SECRET (staff login) or ADMIN_TOKEN',
      });
    }
    return res.status(401).json({ status: 'fail', message: 'unauthorized' });
  }

  let adminUsersRouter;
  if (authEnabled) {
    // The shared router's public /authors routes serve the blog bylines and the
    // /authors/<slug> pages. They expose only the byline projection (name and
    // authorProfile), and only for users with an author slug set, never email,
    // role or status.
    adminUsersRouter = createAdminUsersRouter({ AdminUser, auth: { protect: guard, restrictTo } });
  } else {
    adminUsersRouter = Router().use((_req, res) =>
      res.status(503).json({ status: 'error', message: 'admin users disabled: set JWT_SECRET' })
    );
  }

  return { authRouter, adminUsersRouter, guard, restrictTo, authEnabled, AdminUser };
}
