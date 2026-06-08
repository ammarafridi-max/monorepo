'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createPricingRuleApi } from '@/services/apiPricingRule';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';

export function useCreatePricingRule() {
  const queryClient = useQueryClient();
  const router = useRouter();

  const { mutate: createPricingRule, isPending: isCreatingPricingRule } =
    useMutation({
      mutationFn: createPricingRuleApi,
      onSuccess: () => {
        router.push('/admin/pricing');
        toast.success('Pricing rule created successfully');
        queryClient.invalidateQueries({ queryKey: ['pricing-rules'] });
      },
      onError: () => {
        toast.error('Pricing rule could not be created');
      },
    });

  return { createPricingRule, isCreatingPricingRule };
}
