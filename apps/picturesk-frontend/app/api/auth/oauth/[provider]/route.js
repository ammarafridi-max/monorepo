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
    maxAge: 600, 
  };
  res.cookies.set(STATE_COOKIE, state, cookie);
  res.cookies.set(NEXT_COOKIE, safeNext(new URL(req.url).searchParams.get('next')), cookie);
  return res;
}
