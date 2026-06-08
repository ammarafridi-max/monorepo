'use client';
import { useMutation } from '@tanstack/react-query';
import { deletePricingRuleApi } from '@/services/apiPricingRule';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

export function useDeletePricingRule() {
  const router = useRouter();
  const { mutate: deletePricingRule, isPending: isDeletingPricingRule } =
    useMutation({
      mutationFn: async (id) => {
        const confirmDelete = window.confirm(
          'Are you sure you want to delete this pricing rule?'
        );
        if (!confirmDelete) throw new Error('Delete cancelled');
        return deletePricingRuleApi(id);
      },
      onSuccess: () => {
        toast.success('Pricing rule deleted successfully');
        router.push('/admin/pricing');
      },
      onError: () => {
        toast.error('Pricing rule could not be deleted');
      },
    });

  return { deletePricingRule, isDeletingPricingRule };
}
