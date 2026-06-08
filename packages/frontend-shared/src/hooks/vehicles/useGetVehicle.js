'use client';
import { useQuery } from '@tanstack/react-query';
import { getVehicleApi } from '../../services/apiVehicles.js';

export function useGetVehicle(id) {
  const {
    data: vehicle,
    isLoading: isLoadingVehicle,
    isError: isErrorVehicle,
  } = useQuery({
    queryKey: ['vehicle', id],
    queryFn: () => getVehicleApi(id),
    enabled: !!id,
  });

  return { vehicle, isLoadingVehicle, isErrorVehicle };
}
