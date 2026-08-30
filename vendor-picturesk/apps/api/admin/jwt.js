import jwt from 'jsonwebtoken';

/**
 * The admin session cookie name. Deliberately DIFFERENT from the customer web
 * session (`picturesk_session`, a jose token set by the Next app): admin auth is a
 * separate identity on a separate origin (the Express api), so the two never
 * collide. The `type: 'admin'` claim below is a second guard against a customer
 * token ever being accepted here.
 */
export const ADMIN_COOKIE = 'picturesk_admin';

/**
 * Create JWT utilities bound to config. Mirrors the reference: sign carries
 * { id, role, type: 'admin' }; the cookie is httpOnly and, in production,
 * cross-site (sameSite:'none'; secure) because the api and web are separate
 * origins/Fly apps. In dev they are same-site (localhost), so sameSite:'lax'.
 *
 * @param {{ jwtSecret: string, jwtExpiresIn: string, cookieExpiresInDays: number, nodeEnv: string }} config
 */
export function createJwtUtils({ jwtSecret, jwtExpiresIn, cookieExpiresInDays, nodeEnv }) {
  const signToken = (id, role) =>
    jwt.sign({ id: String(id), role, type: 'admin' }, jwtSecret, { expiresIn: jwtExpiresIn });

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
