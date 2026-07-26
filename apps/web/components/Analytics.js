'use client';

import { useEffect, useState } from 'react';
import Script from 'next/script';
import {
  ANALYTICS_DOMAIN,
  ANALYTICS_SRC,
  GA_ID,
  CLARITY_ID,
  plausibleEnabled,
  gaEnabled,
  clarityEnabled,
} from '../lib/analytics';

// Where the visitor's cookie choice is remembered. localStorage (not a cookie) so
// storing the choice itself sets nothing that would need consent.
const CONSENT_KEY = 'picturesk.consent'; // 'granted' | 'denied'

// Loads analytics scripts ONLY for the providers configured at build time, and only
// with the visitor's consent where consent is required. Plausible is cookieless and
// loads without consent; Google Analytics 4 and Microsoft Clarity set cookies, so we
// gate them behind an opt-in banner (applied to everyone, the strictest common rule
// for an international audience). track() (lib/analytics.js) fans custom funnel events
// out to whichever script ends up loaded; before consent those calls are safe no-ops.
export default function Analytics() {
  const plausible = plausibleEnabled();
  const ga = gaEnabled();
  const clarity = clarityEnabled();

  // Cookie-setting tools that require opt-in.
  const needsConsent = ga || clarity;

  // null = undecided (also the server-render value, so nothing consent-gated renders
  // until the client has read the saved choice, avoiding a hydration mismatch).
  const [consent, setConsent] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(CONSENT_KEY);
      if (saved === 'granted' || saved === 'denied') setConsent(saved);
    } catch {}
    setReady(true);
  }, []);

  function choose(value) {
    try {
      window.localStorage.setItem(CONSENT_KEY, value);
    } catch {}
    setConsent(value);
  }

  if (!plausible && !ga && !clarity) return null;

  const consented = consent === 'granted';
  const showBanner = ready && needsConsent && consent === null;

  return (
    <>
      {/* Plausible: cookieless, no consent needed. */}
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

      {/* GA4: cookie-based, loads only after opt-in. */}
      {ga && consented && (
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

      {/* Microsoft Clarity: session replay + heatmaps, cookie-based, loads only after opt-in. */}
      {clarity && consented && (
        <Script id="clarity-init" strategy="afterInteractive">
          {`(function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);})(window,document,"clarity","script","${CLARITY_ID}");`}
        </Script>
      )}

      {showBanner && (
        <div className="consent" role="dialog" aria-label="Cookie choices" aria-live="polite">
          <p className="consent__text">
            We use analytics cookies to see how the site is used. Essential cookies always run.{' '}
            <a href="/privacy">Privacy Policy</a>.
          </p>
          <div className="consent__actions">
            <button type="button" className="btn btn--link" onClick={() => choose('denied')}>
              Decline
            </button>
            <button type="button" className="btn btn--primary" onClick={() => choose('granted')}>
              Accept
            </button>
          </div>
        </div>
      )}
    </>
  );
}
