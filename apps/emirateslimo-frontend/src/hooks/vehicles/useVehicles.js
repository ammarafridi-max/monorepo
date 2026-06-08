'use client';
import { useQuery } from '@tanstack/react-query';
import { getAllVehiclesApi } from '@/services/apiVehicles';

export function useVehicles() {
  const {
    data: vehicles,
    isLoading: isLoadingVehicles,
    isError: isErrorVehicles,
  } = useQuery({
    queryKey: ['vehicles'],
    queryFn: getAllVehiclesApi,
    keepPreviousData: true,
    staleTime: 5 * 60 * 1000,
  });

  return {
    vehicles: vehicles ?? [],
    isLoadingVehicles,
    isErrorVehicles,
  };
}
