import { AppError, catchAsync } from '@travel-suite/utils';

/**
 * Creates admin auth middleware with injected dependencies.
 * @param {{ AdminUser: import('mongoose').Model, verifyToken: Function }} deps
 * @returns {{ protect: Function, identify: Function, restrictTo: Function }}
 */
export function createAdminAuthMiddleware({ AdminUser, verifyToken }) {
  const protect = catchAsync(async (req, res, next) => {
    const token = req.cookies?.jwt;

    if (!token || token === 'loggedout') {
      return next(new AppError('You need to login to access this route.', 401));
    }

    let decoded;
    try {
      decoded = verifyToken(token);
    } catch {
      return next(new AppError('Invalid or expired token.', 401));
    }

    if (decoded.type && decoded.type !== 'admin') {
      return next(new AppError('Invalid session type.', 401));
    }

    const currentUser = await AdminUser.findById(decoded.id).select('+passwordChangedAt');
    if (!currentUser || currentUser.status === 'INACTIVE') {
      return next(new AppError('The user belonging to this token does not exist.', 401));
    }

    // Reject tokens issued before a password change (logs out other devices)
    if (currentUser.passwordChangedAt) {
      const changedAt = Math.floor(currentUser.passwordChangedAt.getTime() / 1000);
      if (decoded.iat < changedAt) {
        return next(new AppError('Password was recently changed. Please log in again.', 401));
      }
    }

    req.user = currentUser;
    res.locals.user = currentUser;
    next();
  });

  /**
   * Soft authentication: sets `req.user` when a valid admin session is present
   * and otherwise continues anonymously. Never rejects.
   *
   * For routes a customer must reach without logging in but which return more
   * to staff than to the public — a booking receipt is the case this exists
   * for. `protect` cannot serve those: it would lock the customer out of their
   * own confirmation page.
   *
   * The handler is then responsible for redacting when `req.user` is absent.
   * Adding this middleware alone changes nothing.
   */
  const identify = async (req, res, next) => {
    const token = req.cookies?.jwt;
    if (!token || token === 'loggedout') return next();

    try {
      const decoded = verifyToken(token);
      if (decoded.type && decoded.type !== 'admin') return next();

      const currentUser = await AdminUser.findById(decoded.id).select('+passwordChangedAt');
      if (!currentUser || currentUser.status === 'INACTIVE') return next();

      if (currentUser.passwordChangedAt) {
        const changedAt = Math.floor(currentUser.passwordChangedAt.getTime() / 1000);
        if (decoded.iat < changedAt) return next();
      }

      req.user = currentUser;
      res.locals.user = currentUser;
    } catch {
      // A bad or expired token is simply an anonymous caller here, not an error.
    }
    return next();
  };

  const restrictTo = (...roles) => (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(new AppError('You do not have permission to perform this action', 403));
    }
    next();
  };

  return { protect, identify, restrictTo };
}
