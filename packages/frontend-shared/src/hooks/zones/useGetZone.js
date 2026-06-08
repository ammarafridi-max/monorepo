'use client';
import { useQuery } from '@tanstack/react-query';
import { getZoneApi } from '../../services/apiZones.js';

export function useGetZone(id) {
  const {
    data: zone,
    isLoading: isLoadingZone,
    isError: isErrorZone,
  } = useQuery({
    queryKey: ['zone', id],
    queryFn: () => getZoneApi(id),
    enabled: !!id,
  });

  return { zone, isLoadingZone, isErrorZone };
}
