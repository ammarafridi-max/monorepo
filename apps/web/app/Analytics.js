'use client';

import Script from 'next/script';
import { ANALYTICS_DOMAIN, ANALYTICS_SRC, analyticsEnabled } from '../lib/analytics';

// Loads the Plausible script ONLY when NEXT_PUBLIC_ANALYTICS_DOMAIN is set. When
// unset this renders nothing, so a build/deploy with no analytics key ships no
// third-party script at all (clean, cookieless local dev). The script itself
// auto-tracks a basic pageview on every route (the only thing tracked on the
// legal/content pages); custom funnel events are fired explicitly via track().
export default function Analytics() {
  if (!analyticsEnabled()) return null;

  return (
    <>
      <Script
        defer
        data-domain={ANALYTICS_DOMAIN}
        src={ANALYTICS_SRC}
        strategy="afterInteractive"
      />
      {/* Standard Plausible queue shim so window.plausible(...) works for custom
          events even before the script finishes loading. */}
      <Script id="plausible-init" strategy="afterInteractive">
        {`window.plausible=window.plausible||function(){(window.plausible.q=window.plausible.q||[]).push(arguments)}`}
      </Script>
    </>
  );
}
