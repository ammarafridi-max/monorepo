import { NextResponse } from "next/server";

const SITE = "https://www.visawadi.ae";

export function proxy(req) {
  const host = req.headers.get("host") || "";
  const { pathname, search } = req.nextUrl;

  // Apex to www. No legacy-path redirects yet: this is a new site with no old
  // URLs to preserve. Add them here as they appear.
  if (host === "visawadi.ae") {
    return NextResponse.redirect(`${SITE}${pathname}${search}`, 308);
  }
}

export const config = {
  matcher: "/((?!_next|api|.*\\..*).*)",
};
