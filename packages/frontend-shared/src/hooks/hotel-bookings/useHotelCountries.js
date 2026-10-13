'use client';
import { useQuery } from '@tanstack/react-query';
import { getHotelCountriesApi } from '../../services/apiHotelBookings.js';

export function useHotelCountries() {
  const { data: countries = [], isLoading: isLoadingCountries } = useQuery({
    queryKey: ['hotelCountries'],
    queryFn: getHotelCountriesApi,
    staleTime: 24 * 60 * 60 * 1000,
  });

  return { countries, isLoadingCountries };
}
