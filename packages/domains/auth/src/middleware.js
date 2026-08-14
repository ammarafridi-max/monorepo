import { AppError, catchAsync } from '@travel-suite/utils';

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
