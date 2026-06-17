'use client';
import { useQuery } from '@tanstack/react-query';
import { useDebounce } from '../general/useDebounce.js';
import { searchCitiesApi } from '../../services/apiLocations.js';

// Debounced city autocomplete. Returns [{ name, countryCode }].
export function useCitySearch(query) {
  const debouncedQuery = useDebounce(query, 300);

  const {
    data: cities = [],
    isLoading: isLoadingCities,
    isError: isErrorCities,
  } = useQuery({
    queryKey: ['city-search', debouncedQuery],
    queryFn: () => searchCitiesApi(debouncedQuery),
    enabled: !!debouncedQuery && debouncedQuery.length >= 2,
    staleTime: 1000 * 60 * 5,
    placeholderData: (prev) => prev,
  });

  return { cities, isLoadingCities, isErrorCities };
}
