'use client';
import { useQuery } from '@tanstack/react-query';
import { getOverlaysApi } from '../../services/apiVisa.js';

export function useVisaOverlays(visaSlug) {
  const { data, isLoading: isLoadingOverlays, isError: isErrorOverlays } = useQuery({
    queryKey: ['visa-overlays', visaSlug],
    queryFn: () => getOverlaysApi({ visaSlug }),
    enabled: !!visaSlug,
  });

  const overlays = Array.isArray(data) ? data : [];
  const byResidence = Object.fromEntries(overlays.map((o) => [o.residence, o]));

  return { overlays, byResidence, isLoadingOverlays, isErrorOverlays };
}
