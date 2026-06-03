'use client';
import { useQuery } from '@tanstack/react-query';
import { useDebounce } from '../general/useDebounce.js';
import { getLocationSuggestionsApi } from '../../services/apiLocations.js';

export function useLocationSuggestions(query) {
  const debouncedQuery = useDebounce(query, 350);

  const {
    data: suggestions = [],
    isLoading: isLoadingSuggestions,
    isError: isErrorSuggestions,
  } = useQuery({
    queryKey: ['location-suggestions', debouncedQuery],
    queryFn: () => getLocationSuggestionsApi(debouncedQuery),
    enabled: !!debouncedQuery && debouncedQuery.length >= 3,
    staleTime: 1000 * 60 * 5,
    placeholderData: (prev) => prev,
  });

  return { suggestions, isLoadingSuggestions, isErrorSuggestions };
}
