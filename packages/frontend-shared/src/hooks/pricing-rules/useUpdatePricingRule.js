'use client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { updatePricingRuleApi } from '../../services/apiPricingRules.js';

export function useUpdatePricingRule() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const { mutate: updatePricingRule, isPending: isUpdatingPricingRule } = useMutation({
    mutationFn: ({ id, pricingRuleData }) => updatePricingRuleApi(id, pricingRuleData),
    onSuccess: (_, variables) => {
      toast.success('Pricing rule updated successfully');
      queryClient.invalidateQueries({ queryKey: ['pricing-rules'] });
      queryClient.invalidateQueries({ queryKey: ['pricing-rule', variables.id] });
      router.push('/admin/pricing-rules');
    },
    onError: (err) => {
      toast.error(err.message || 'Pricing rule could not be updated');
    },
  });

  return { updatePricingRule, isUpdatingPricingRule };
}
