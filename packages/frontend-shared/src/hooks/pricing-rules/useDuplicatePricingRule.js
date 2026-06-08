'use client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { duplicatePricingRuleApi } from '../../services/apiPricingRules.js';

export function useDuplicatePricingRule() {
  const queryClient = useQueryClient();

  const { mutate: duplicatePricingRule, isPending: isDuplicatingPricingRule } = useMutation({
    mutationFn: (id) => duplicatePricingRuleApi(id),
    onSuccess: () => {
      toast.success('Pricing rule duplicated successfully');
      queryClient.invalidateQueries({ queryKey: ['pricing-rules'] });
    },
    onError: (err) => {
      toast.error(err.message || 'Pricing rule could not be duplicated');
    },
  });

  return { duplicatePricingRule, isDuplicatingPricingRule };
}
