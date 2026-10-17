'use client';

import { useEffect } from 'react';
import { track } from '../lib/analytics';

export default function TrackEvent({ event, props }) {
  const key = JSON.stringify(props ?? null);
  useEffect(() => {
    track(event, props);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [event, key]);
  return null;
}
