import { NextResponse } from 'next/server';
import {
  getProvider,
  isConfigured,
  authorizeUrl,
  redirectUri,
  STATE_COOKIE,
  NEXT_COOKIE,
} from '../../../../../lib/oauth';
import { safeNext } from '../../../../../lib/redirects';

// GET /api/auth/oauth/:provider -> begin the OAuth code flow. Set a one-time CSRF
// state cookie and bounce the browser to the provider's consent screen. Using a
// NextResponse (not next/navigation redirect) so the Set-Cookie reliably rides the
// external redirect. Unknown or unconfigured provider fails closed to login.
export async function GET(req, { params }) {
  const name = (await params).provider;
  if (!getProvider(name) || !isConfigured(name)) {
    return NextResponse.redirect(new URL('/login?error=1', req.url));
  }

  const state = crypto.randomUUID();
  const res = NextResponse.redirect(authorizeUrl(name, state, redirectUri(req, name)));
  const cookie = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 600, // 10 minutes to complete consent
  };
  res.cookies.set(STATE_COOKIE, state, cookie);
  res.cookies.set(NEXT_COOKIE, safeNext(new URL(req.url).searchParams.get('next')), cookie);
  return res;
}
