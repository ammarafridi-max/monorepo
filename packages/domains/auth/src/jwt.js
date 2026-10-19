import jwt from 'jsonwebtoken';

export const TOKEN_ISSUER = 'travel-suite';
export const ADMIN_AUDIENCE = 'travel-suite:admin';

export function createJwtUtils({ jwtSecret, jwtExpiresIn, cookieExpiresInDays, nodeEnv }) {
  const signToken = (id, role) =>
    jwt.sign({ id, role, type: 'admin' }, jwtSecret, {
      expiresIn: jwtExpiresIn,
      issuer: TOKEN_ISSUER,
      audience: ADMIN_AUDIENCE,
    });

  const verifyToken = (token) =>
    jwt.verify(token, jwtSecret, { issuer: TOKEN_ISSUER, audience: ADMIN_AUDIENCE });

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
