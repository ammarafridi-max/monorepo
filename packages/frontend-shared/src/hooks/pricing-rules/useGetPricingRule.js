'use client';
import { useQuery } from '@tanstack/react-query';
import { getPricingRuleApi } from '../../services/apiPricingRules.js';

export function useGetPricingRule(id) {
  const {
    data: pricingRule,
    isLoading: isLoadingPricingRule,
    isError: isErrorPricingRule,
  } = useQuery({
    queryKey: ['pricing-rule', id],
    queryFn: () => getPricingRuleApi(id),
    enabled: !!id,
  });

  return { pricingRule, isLoadingPricingRule, isErrorPricingRule };
}
