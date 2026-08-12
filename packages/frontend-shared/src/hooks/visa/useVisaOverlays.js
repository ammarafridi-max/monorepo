'use client';
import { useQuery } from '@tanstack/react-query';
import { getOverlaysApi } from '../../services/apiVisa.js';

/**
 * Every country overlay for one visa page, in one request.
 *
 * The list endpoint rather than one GET per country: the editor needs to know
 * which country tabs already have an overlay before you click any of them, and
 * the per-country endpoint 404s when there is none, which is a normal state
 * here rather than an error.
 */
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
