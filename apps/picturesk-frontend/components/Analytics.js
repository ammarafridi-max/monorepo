'use client';

import { useEffect, useState } from 'react';
import AnalyticsInit from '@travel-suite/frontend-shared/components/shared/AnalyticsInit';
import { analyticsEnabled } from '../lib/analytics';

// localStorage rather than a cookie, so storing the choice sets nothing that would itself need consent.
const CONSENT_KEY = 'picturesk.consent';

export default function Analytics() {
  const enabled = analyticsEnabled();

  // null until the client reads the saved choice, so the server render and hydration agree.
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

  if (!enabled) return null;

  const showBanner = ready && consent === null;

  return (
    <>
      <AnalyticsInit enabled={consent === 'granted'} />

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
