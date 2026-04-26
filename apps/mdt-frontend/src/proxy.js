import { NextResponse } from 'next/server';

export function proxy(req) {
  const host = req.headers.get('host') || '';
  const { pathname, search } = req.nextUrl;

  // Permanent redirect: legacy /blog/tag/<slug> → /blog/tags/<slug>
  if (pathname.startsWith('/blog/tag/')) {
    const newPathname = pathname.replace('/blog/tag/', '/blog/tags/');
    return NextResponse.redirect(`https://www.mydummyticket.ae${newPathname}${search}`, 308);
  }

  // Permanent redirect: apex → www
  if (host === 'mydummyticket.ae') {
    return NextResponse.redirect(`https://www.mydummyticket.ae${pathname}${search}`, 308);
  }
}

export const config = {
  matcher: '/((?!_next|api|.*\\..*).*)',
};
