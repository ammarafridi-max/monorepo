import { AppError, catchAsync } from '@travel-suite/utils';

/**
 * Creates admin auth middleware with injected dependencies.
 * @param {{ AdminUser: import('mongoose').Model, verifyToken: Function }} deps
 * @returns {{ protect: Function, restrictTo: Function }}
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

    const currentUser = await AdminUser.findById(decoded.id);
    if (!currentUser || currentUser.status === 'INACTIVE') {
      return next(new AppError('The user belonging to this token does not exist.', 401));
    }

    req.user = currentUser;
    res.locals.user = currentUser;
    next();
  });

  const restrictTo = (...roles) => (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(new AppError('You do not have permission to perform this action', 403));
    }
    next();
  };

  return { protect, restrictTo };
}
