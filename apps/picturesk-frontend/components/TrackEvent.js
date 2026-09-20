'use client';

import { useEffect } from 'react';
import { track } from '../lib/analytics';

// Fires a single funnel event once on mount. Used for view events (e.g.
// landing_view) that a server component wants to record. No-op when analytics is
// disabled.
export default function TrackEvent({ event, props }) {
  const key = JSON.stringify(props ?? null);
  useEffect(() => {
    track(event, props);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [event, key]);
  return null;
}
