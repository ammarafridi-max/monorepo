'use client';

import { useEffect, useState } from 'react';
import { getVisaDestinationsApi } from '../../services/apiVisaRequirements.js';

/**
 * The destinations the checker can actually answer for.
 *
 * Offering every country in the world when only a handful have rules behind
 * them means most searches return UNKNOWN, which reads as a broken tool. While
 * this is loading the search bar shows nothing rather than a stale list.
 */
export function useVisaDestinations() {
  const [destinations, setDestinations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    getVisaDestinationsApi()
      .then((res) => {
        if (cancelled) return;
        const rows = res?.data ?? res ?? [];
        setDestinations(rows.map((d) => ({ code: d.code, name: d.name, visaSlug: d.visaSlug })));
      })
      .catch((err) => {
        if (!cancelled) setError(err?.message || 'Could not load destinations');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { destinations, loading, error };
}
