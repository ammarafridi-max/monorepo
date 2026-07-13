import { AppError, catchAsync } from './errors.js';
import { ADMIN_COOKIE } from './jwt.js';

/**
 * Authorize by role. Standalone (depends only on req.user.role, set by `protect`
 * OR by the ADMIN_TOKEN break-glass path), so admin data routes can reuse it even
 * when the JWT auth layer is disabled. Returns 403 for a missing/mismatched role.
 */
export function restrictTo(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(new AppError('You do not have permission to perform this action', 403));
    }
    next();
  };
}

/**
 * Create the admin auth guards. `protect` authenticates the request from the
 * httpOnly cookie and attaches the live AdminUser to req.user; `restrictTo(...roles)`
 * authorizes by role. Mirrors the reference exactly, keyed on Picturesk's cookie.
 *
 * The security boundary is HERE (server-side), not the web guard: it verifies the
 * signature, rejects non-admin token types, reloads the user (so an INACTIVE or
 * deleted admin is rejected mid-session), and invalidates tokens issued before a
 * password change.
 *
 * @param {{ AdminUser: import('mongoose').Model, verifyToken: Function }} deps
 * @returns {{ protect: Function, restrictTo: Function }}
 */
export function createAdminAuthMiddleware({ AdminUser, verifyToken }) {
  const protect = catchAsync(async (req, res, next) => {
    const token = req.cookies?.[ADMIN_COOKIE];
    if (!token || token === 'loggedout') {
      return next(new AppError('You need to log in to access this route.', 401));
    }

    let decoded;
    try {
      decoded = verifyToken(token);
    } catch {
      return next(new AppError('Invalid or expired session. Please log in again.', 401));
    }

    // Reject a token that is not an admin token (e.g. a customer session type).
    if (decoded.type && decoded.type !== 'admin') {
      return next(new AppError('Invalid session type.', 401));
    }

    const currentUser = await AdminUser.findById(decoded.id).select('+passwordChangedAt');
    if (!currentUser || currentUser.status === 'INACTIVE') {
      return next(new AppError('The account for this session no longer exists.', 401));
    }

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

  return { protect, restrictTo };
}
