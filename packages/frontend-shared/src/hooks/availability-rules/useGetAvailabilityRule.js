'use client';
import { useQuery } from '@tanstack/react-query';
import { getAvailabilityRuleApi } from '../../services/apiAvailabilityRules.js';

export function useGetAvailabilityRule(id) {
  const {
    data: availabilityRule,
    isLoading: isLoadingAvailabilityRule,
    isError,
  } = useQuery({
    queryKey: ['availability-rule', id],
    queryFn: () => getAvailabilityRuleApi(id),
    enabled: !!id,
  });

  return { availabilityRule, isLoadingAvailabilityRule, isError };
}
