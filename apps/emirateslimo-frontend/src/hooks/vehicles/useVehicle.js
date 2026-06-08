'use client';
import { useQuery } from '@tanstack/react-query';
import { getVehicleApi } from '@/services/apiVehicles';

export function useVehicle(id) {
  const { data: vehicle, isLoading: isLoadingVehicle } = useQuery({
    queryKey: ['vehicle', id],
    queryFn: () => getVehicleApi(id),
    enabled: !!id,
  });

  return { vehicle, isLoadingVehicle };
}
