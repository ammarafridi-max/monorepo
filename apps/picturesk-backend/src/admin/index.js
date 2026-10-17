import { Router } from 'express';
import { createAuthRouter } from '@travel-suite/auth';
import { createAdminUsersRouter } from '@travel-suite/admin-users';

export function createAdminSubsystem({
  db,
  jwtSecret,
  jwtExpiresIn,
  cookieExpiresInDays,
  nodeEnv,
  adminToken,
  isTokenAuthorized,
  sendEmail,
  brandName,
  loginUrl,
  logger,
}) {
  const authEnabled = Boolean(jwtSecret);

  let authRouter = null;
  let protect = null;
  let restrictTo = null;
  let AdminUser = null;

  if (authEnabled) {
    const built = createAuthRouter({
      db,
      jwtSecret,
      jwtExpiresIn,
      cookieExpiresInDays,
      nodeEnv,
      sendEmail,
      brandName,
      loginUrl,
      logger,
    });
    authRouter = built.router;
    protect = built.middleware.protect;
    restrictTo = built.middleware.restrictTo;
    AdminUser = built.AdminUser;
  } else {
    authRouter = Router().use((_req, res) =>
      res.status(503).json({ status: 'error', message: 'admin auth disabled: set JWT_SECRET' })
    );
    restrictTo = (...roles) => (req, res, next) =>
      req.user && roles.includes(req.user.role)
        ? next()
        : res.status(403).json({ status: 'fail', message: 'You do not have permission to perform this action' });
  }

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
    adminUsersRouter = createAdminUsersRouter({ AdminUser, auth: { protect: guard, restrictTo } });
  } else {
    adminUsersRouter = Router().use((_req, res) =>
      res.status(503).json({ status: 'error', message: 'admin users disabled: set JWT_SECRET' })
    );
  }

  return { authRouter, adminUsersRouter, guard, restrictTo, authEnabled, AdminUser };
}
