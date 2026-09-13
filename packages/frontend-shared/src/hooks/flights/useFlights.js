'use client';
import { useQuery } from '@tanstack/react-query';
import { getFlightsApi } from '../../services/apiFlights.js';

export function useFlights(formData) {
  const {
    data: flights,
    isLoading: isLoadingFlights,
    isError: isErrorFlights,
    error: flightsError,
  } = useQuery({
    queryKey: ['flights', formData],
    queryFn: () => getFlightsApi(formData),
    enabled: Boolean(formData?.from && formData?.to && formData?.departureDate),
    retry: false,
    staleTime: 1000 * 60 * 5,
  });

  return { flights, isLoadingFlights, isErrorFlights, flightsError };
}
