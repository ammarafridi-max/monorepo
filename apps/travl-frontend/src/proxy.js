import { NextResponse } from 'next/server';

export function proxy(req) {
  const host = req.headers.get('host') || '';
  const { pathname, search } = req.nextUrl;

  if (pathname.startsWith('/blog/tag/')) {
    const newPathname = pathname.replace('/blog/tag/', '/blog/tags/');
    return NextResponse.redirect(`https://www.travl.ae${newPathname}${search}`, 308);
  }

  if (host === 'travl.ae') {
    return NextResponse.redirect(`https://www.travl.ae${pathname}${search}`, 308);
  }
}

export const config = {
  matcher: '/((?!_next|api|.*\\..*).*)',
};
