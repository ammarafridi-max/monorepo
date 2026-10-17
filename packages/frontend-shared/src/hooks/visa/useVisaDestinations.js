'use client';

import { useEffect, useState } from 'react';
import { getVisaDestinationsApi } from '../../services/apiVisaRequirements.js';

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
