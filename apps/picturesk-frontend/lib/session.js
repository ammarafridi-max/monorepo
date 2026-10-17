import 'server-only';
import { cookies } from 'next/headers';
import { SignJWT, jwtVerify } from 'jose';


const COOKIE = 'picturesk_session';
const MAX_AGE_SECONDS = 60 * 60 * 24 * 30; 

function secret() {
  const s = process.env.AUTH_SECRET;
  if (!s) throw new Error('[web] AUTH_SECRET is required');
  return new TextEncoder().encode(s);
}

export async function createSessionCookie(user) {
  const token = await new SignJWT({ email: user.email })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(user._id.toString())
    .setIssuedAt()
    .setExpirationTime('30d')
    .sign(secret());

  const jar = await cookies();
  jar.set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: MAX_AGE_SECONDS,
  });
}

export async function clearSessionCookie() {
  const jar = await cookies();
  jar.delete(COOKIE);
}

export async function getSession() {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    return { userId: String(payload.sub), email: String(payload.email) };
  } catch {
    return null;
  }
}
