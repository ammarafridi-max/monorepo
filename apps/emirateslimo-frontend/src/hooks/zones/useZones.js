'use client';
import { useQuery } from '@tanstack/react-query';
import { getZonesApi } from '@/services/apiZones';

export function useZones() {
  const {
    data: zones,
    isLoading: isLoadingZones,
    isError: isErrorZones,
    error,
  } = useQuery({
    queryKey: ['zones'],
    queryFn: getZonesApi,
    staleTime: 5 * 60 * 1000, // cache for 5 min
    refetchOnMount: 'always',
  });

  return { zones, isLoadingZones, isErrorZones, error };
}
