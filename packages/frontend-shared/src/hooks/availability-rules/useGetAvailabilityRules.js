'use client';
import { useQuery } from '@tanstack/react-query';
import { getAvailabilityRulesApi } from '../../services/apiAvailabilityRules.js';

export function useGetAvailabilityRules(params = {}) {
  const {
    data: availabilityRules,
    isLoading: isLoadingAvailabilityRules,
    isError,
  } = useQuery({
    queryKey: ['availability-rules', params],
    queryFn: () => getAvailabilityRulesApi(params),
    placeholderData: (prev) => prev,
  });

  return { availabilityRules, isLoadingAvailabilityRules, isError };
}
