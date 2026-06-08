'use client';
import { useQuery } from '@tanstack/react-query';
import { getPricingRuleApi } from '@/services/apiPricingRule';

export function usePricingRule(id) {
  const { data: pricingRule, isLoading: isLoadingPricingRule } = useQuery({
    queryKey: ['pricing-rule', id],
    queryFn: () => getPricingRuleApi(id),
    enabled: !!id, // only fetch when id exists
  });

  return { pricingRule, isLoadingPricingRule };
}
