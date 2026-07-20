'use client';

import Script from 'next/script';
import { ANALYTICS_DOMAIN, ANALYTICS_SRC, GA_ID, plausibleEnabled, gaEnabled } from '../lib/analytics';

// Loads analytics scripts ONLY for the providers configured at build time. With
// nothing set this renders nothing, so a build/deploy with no analytics keys ships
// no third-party script at all (clean, cookieless local dev). Plausible and GA4 can
// both run; track() (lib/analytics.js) fans custom funnel events out to whichever
// script is loaded.
export default function Analytics() {
  const plausible = plausibleEnabled();
  const ga = gaEnabled();
  if (!plausible && !ga) return null;

  return (
    <>
      {plausible && (
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
      )}
      {ga && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
            strategy="afterInteractive"
          />
          <Script id="ga-init" strategy="afterInteractive">
            {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${GA_ID}');`}
          </Script>
        </>
      )}
    </>
  );
}
