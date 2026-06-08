'use client';
import { useQuery } from '@tanstack/react-query';
import { getPricingRulesApi } from '../../services/apiPricingRules.js';

export function useGetPricingRules(params = {}) {
  const {
    data: pricingRules,
    isLoading: isLoadingPricingRules,
    isError,
  } = useQuery({
    queryKey: ['pricing-rules', params],
    queryFn: () => getPricingRulesApi(params),
    placeholderData: (prev) => prev,
  });

  return { pricingRules, isLoadingPricingRules, isError };
}
