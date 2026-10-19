import jwt from 'jsonwebtoken';
import { AppError } from '@travel-suite/utils';
import { CSRF_HEADER, hasCsrfHeader, isStateChangingMethod } from '@travel-suite/utils/csrf';
import { TOKEN_ISSUER, CUSTOMER_AUDIENCE } from './service.js';

export function createUserMiddleware({ User, jwtSecret }) {
  const protect = async (req, res, next) => {
    try {
      let token;
      let fromCookie = false;
      if (req.headers.authorization?.startsWith('Bearer ')) {
        token = req.headers.authorization.split(' ')[1];
      } else if (req.cookies?.userJwt) {
        token = req.cookies.userJwt;
        fromCookie = true;
      }
      if (!token) return next(new AppError('You are not logged in', 401));

      if (fromCookie && isStateChangingMethod(req.method) && !hasCsrfHeader(req)) {
        return next(new AppError(`Missing ${CSRF_HEADER} header.`, 403));
      }

      const decoded = jwt.verify(token, jwtSecret, {
        issuer: TOKEN_ISSUER,
        audience: CUSTOMER_AUDIENCE,
      });
      const user = await User.findById(decoded.id).select('+passwordChangedAt');
      if (!user || !user.isActive) return next(new AppError('User no longer exists', 401));

      if (user.passwordChangedAt) {
        const changedAt = Math.floor(user.passwordChangedAt.getTime() / 1000);
        if (decoded.iat < changedAt) {
          return next(new AppError('Password was recently changed. Please log in again.', 401));
        }
      }

      req.user = user;
      next();
    } catch {
      next(new AppError('Invalid or expired token', 401));
    }
  };

  return { protect };
}
