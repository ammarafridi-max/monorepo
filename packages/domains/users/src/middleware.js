import jwt from 'jsonwebtoken';
import { AppError } from '@travel-suite/utils';

export function createUserMiddleware({ User, jwtSecret }) {
  const protect = async (req, res, next) => {
    try {
      let token;
      if (req.headers.authorization?.startsWith('Bearer ')) {
        token = req.headers.authorization.split(' ')[1];
      } else if (req.cookies?.userJwt) {
        token = req.cookies.userJwt;
      }
      if (!token) return next(new AppError('You are not logged in', 401));

      const decoded = jwt.verify(token, jwtSecret);
      const user = await User.findById(decoded.id);
      if (!user || !user.isActive) return next(new AppError('User no longer exists', 401));

      req.user = user;
      next();
    } catch {
      next(new AppError('Invalid or expired token', 401));
    }
  };

  return { protect };
}
