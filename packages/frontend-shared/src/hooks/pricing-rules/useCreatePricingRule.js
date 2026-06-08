'use client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { createPricingRuleApi } from '../../services/apiPricingRules.js';

export function useCreatePricingRule() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const { mutate: createPricingRule, isPending: isCreatingPricingRule } = useMutation({
    mutationFn: createPricingRuleApi,
    onSuccess: () => {
      toast.success('Pricing rule created successfully');
      queryClient.invalidateQueries({ queryKey: ['pricing-rules'] });
      router.push('/admin/pricing-rules');
    },
    onError: (err) => {
      toast.error(err.message || 'Pricing rule could not be created');
    },
  });

  return { createPricingRule, isCreatingPricingRule };
}
