'use client';

import { useState } from 'react';
import { checkVisaRequirementApi } from '../../services/apiVisaRequirements.js';

export function useVisaCheck() {
  const [nationality, setNationality] = useState('');
  const [residence, setResidence] = useState('');
  const [destination, setDestination] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(e) {
    e?.preventDefault?.();
    setError('');
    setResult(null);
    if (!nationality || !destination) {
      setError('Pick your nationality and where you are going.');
      return;
    }
    setLoading(true);
    try {
      const res = await checkVisaRequirementApi({ nationality, residence, destination });
      setResult(res?.data ?? res);
    } catch (err) {
      setError(err?.message || 'Something went wrong. Try again in a moment.');
    } finally {
      setLoading(false);
    }
  }

  function reset() {
    setResult(null);
    setError('');
  }

  return {
    nationality, setNationality,
    residence, setResidence,
    destination, setDestination,
    result, error, loading, submit, reset,
  };
}
