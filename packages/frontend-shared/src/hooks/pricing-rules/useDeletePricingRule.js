'use client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { deletePricingRuleApi } from '../../services/apiPricingRules.js';

export function useDeletePricingRule() {
  const queryClient = useQueryClient();

  const { mutate: deletePricingRule, isPending: isDeletingPricingRule } = useMutation({
    mutationFn: (id) => deletePricingRuleApi(id),
    onSuccess: () => {
      toast.success('Pricing rule deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['pricing-rules'] });
    },
    onError: (err) => {
      toast.error(err.message || 'Pricing rule could not be deleted');
    },
  });

  return { deletePricingRule, isDeletingPricingRule };
}
