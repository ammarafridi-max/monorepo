'use client';
import { useQuery } from '@tanstack/react-query';
import { getAirportsApi } from '../services/apiAirports.js';

export function useAirports(query) {
  const {
    data: airports = [],
    isLoading: isLoadingAirports,
    isError: isErrorAirports,
  } = useQuery({
    queryKey: ['airports', query],
    queryFn: () => getAirportsApi(query),
    enabled: !!query && query.length >= 3,
    staleTime: 1000 * 60 * 5,
  });

  return { airports, isLoadingAirports, isErrorAirports };
}
