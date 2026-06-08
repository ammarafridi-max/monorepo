'use client';
import { useQuery } from '@tanstack/react-query';
import { getAllVehiclesApi } from '../../services/apiVehicles.js';

export function useGetVehicles(params = {}) {
  const { data: vehicles, isLoading: isLoadingVehicles } = useQuery({
    queryKey: ['vehicles', params],
    queryFn: async () => {
      try {
        return await getAllVehiclesApi(params);
      } catch (err) {
        // Backend returns 404 "No vehicles found" when empty — treat as empty list.
        if (/no vehicles found/i.test(err.message)) return [];
        throw err;
      }
    },
    placeholderData: (prev) => prev,
  });

  return { vehicles, isLoadingVehicles };
}
