'use client';
import { useQuery } from '@tanstack/react-query';
import { getUserLocationApi } from '../../services/apiLocations.js';

export function useUserLocation() {
  const {
    data: countryCode = null,
    isLoading: isLoadingUserLocation,
    isError: isErrorUserLocation,
  } = useQuery({
    queryKey: ['user-location'],
    queryFn: getUserLocationApi,
    staleTime: Infinity,
    retry: 1,
  });

  return { countryCode, isLoadingUserLocation, isErrorUserLocation };
}
