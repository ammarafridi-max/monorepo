import { NextResponse } from 'next/server';

// Permanent (301) redirects: dead/soft-404 blog paths and the retired duplicate,
// each pointing to its live canonical. Resolved straight to the www canonical so an
// apex request redirects in a single hop.
// NOTE: the why-you-need -> ...is-mandatory entry must not be DEPLOYED until the
// unique content from why-you-need has been merged into the canonical post.
const GONE_301 = {
  '/blog/how-to-apply-for-a-schengen-visa-from-the-uae-complete-2026-guide-2':
    '/blog/how-to-apply-for-a-schengen-visa-from-the-uae-complete-2026-guide',
  '/blog/schengen-visa-travel-insurance-requirements-minimum-coverage-explained-2':
    '/blog/schengen-visa-travel-insurance-requirements-minimum-coverage-explained',
  '/flight-itinerary': '/travel-itinerary',
  '/blog/why-you-need-travel-insurance-for-your-schengen-visa-application':
    '/blog/why-travel-insurance-is-mandatory-for-a-schengen-visa-and-what-coverage-you-need',
};

export function proxy(req) {
  const host = req.headers.get('host') || '';
  const { pathname, search } = req.nextUrl;

  if (GONE_301[pathname]) {
    return NextResponse.redirect(`https://www.travl.ae${GONE_301[pathname]}${search}`, 301);
  }

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
