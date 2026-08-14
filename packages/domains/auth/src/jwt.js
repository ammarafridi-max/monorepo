import jwt from 'jsonwebtoken';

export function createJwtUtils({ jwtSecret, jwtExpiresIn, cookieExpiresInDays, nodeEnv }) {
  const signToken = (id, role) =>
    jwt.sign({ id, role, type: 'admin' }, jwtSecret, { expiresIn: jwtExpiresIn });

  const verifyToken = (token) => jwt.verify(token, jwtSecret);

  const createCookieOptions = () => {
    const isProd = nodeEnv === 'production';
    return {
      httpOnly: true,
      sameSite: isProd ? 'none' : 'lax',
      secure: isProd,
      path: '/',
      expires: new Date(Date.now() + cookieExpiresInDays * 24 * 60 * 60 * 1000),
    };
  };

  return { signToken, verifyToken, createCookieOptions };
}
