'use client';
import { useQuery } from '@tanstack/react-query';
import { getZonesApi } from '../../services/apiZones.js';

export function useGetZones() {
  const {
    data: zones,
    isLoading: isLoadingZones,
    isError,
  } = useQuery({
    queryKey: ['zones'],
    queryFn: getZonesApi,
  });

  return { zones, isLoadingZones, isError };
}
