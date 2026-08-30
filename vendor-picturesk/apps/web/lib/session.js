import 'server-only';
import { cookies } from 'next/headers';
import { SignJWT, jwtVerify } from 'jose';

/**
 * Sessions as a signed JWT in a secure, httpOnly cookie. Minimal and explicit, in
 * keeping with the repo's hand-rolled clients. The token carries only the user id
 * (subject) and email; everything else is looked up from the User model.
 */

const COOKIE = 'picturesk_session';
const MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 days

function secret() {
  const s = process.env.AUTH_SECRET;
  if (!s) throw new Error('[web] AUTH_SECRET is required');
  return new TextEncoder().encode(s);
}

/** Sign a session for a user and set the httpOnly cookie (call from a route handler). */
export async function createSessionCookie(user) {
  const token = await new SignJWT({ email: user.email })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(user._id.toString())
    .setIssuedAt()
    .setExpirationTime('30d')
    .sign(secret());

  cookies().set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: MAX_AGE_SECONDS,
  });
}

export function clearSessionCookie() {
  cookies().delete(COOKIE);
}

/**
 * The current session, or null. Verifies the cookie's signature; a bad/expired
 * token reads as logged out. Safe to call from server components and handlers.
 * @returns {Promise<{ userId: string, email: string } | null>}
 */
export async function getSession() {
  const token = cookies().get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    return { userId: String(payload.sub), email: String(payload.email) };
  } catch {
    return null;
  }
}
