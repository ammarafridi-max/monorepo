import { NextResponse } from 'next/server';

export function middleware(req) {
  const host = req.headers.get('host') || '';
  const { pathname } = req.nextUrl;

  // Permanent redirect: legacy /blog/tag/<slug> → /blog/tags/<slug>
  if (pathname.startsWith('/blog/tag/')) {
    const url = req.nextUrl.clone();
    url.pathname = pathname.replace('/blog/tag/', '/blog/tags/');
    return NextResponse.redirect(url, 308);
  }

  // Permanent redirect: apex → www
  if (host === 'travl.ae') {
    const url = req.nextUrl.clone();
    url.host = 'www.travl.ae';
    return NextResponse.redirect(url, 308);
  }
}

export const config = {
  matcher: '/((?!_next|api|.*\\..*).*)',
};
