'use client';
import { useQuery } from '@tanstack/react-query';
import { getDistanceApi } from '../../services/apiLocations.js';

export function useDistance({ originLat, originLng, destLat, destLng } = {}) {
  const enabled =
    originLat != null &&
    originLng != null &&
    destLat   != null &&
    destLng   != null;

  const {
    data: distance = null,
    isLoading: isLoadingDistance,
    isError: isErrorDistance,
  } = useQuery({
    queryKey: ['location-distance', originLat, originLng, destLat, destLng],
    queryFn: () => getDistanceApi({ originLat, originLng, destLat, destLng }),
    enabled,
    staleTime: 1000 * 60 * 10,
  });

  return { distance, isLoadingDistance, isErrorDistance };
}
