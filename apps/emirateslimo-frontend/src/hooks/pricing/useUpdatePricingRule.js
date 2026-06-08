'use client';
import { useMutation } from '@tanstack/react-query';
import { updatePricingRuleApi } from '@/services/apiPricingRule';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';

export function useUpdatePricingRule() {
  const router = useRouter();
  const { mutate: updatePricingRule, isPending: isUpdatingPricingRule } =
    useMutation({
      mutationFn: updatePricingRuleApi,
      onSuccess: () => {
        router.push('/admin/pricing');
        toast.success('Pricing rule updated successfully');
      },
      onError: () => {
        toast.error('Pricing rule could not be updated');
      },
    });

  return { updatePricingRule, isUpdatingPricingRule };
}
