'use client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { updateAffiliateApi } from '../../services/apiAffiliates.js';

export function useUpdateAffiliate() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const { mutate: updateAffiliate, isPending: isUpdatingAffiliate } = useMutation({
    mutationFn: ({ id, payload }) => updateAffiliateApi(id, payload),
    onSuccess: (affiliate) => {
      queryClient.invalidateQueries({ queryKey: ['affiliates'] });
      queryClient.setQueryData(['affiliate', affiliate?._id], affiliate);
      toast.success('Affiliate updated successfully');
      router.push('/admin/affiliates');
    },
    onError: (error) => {
      toast.error(error.message || 'Affiliate could not be updated');
    },
  });

  return { updateAffiliate, isUpdatingAffiliate };
}
