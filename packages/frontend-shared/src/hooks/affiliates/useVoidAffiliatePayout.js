'use client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { voidAffiliatePayoutApi } from '../../services/apiAffiliates.js';

export function useVoidAffiliatePayout() {
  const queryClient = useQueryClient();

  const { mutate: voidPayout, isPending: isVoidingPayout } = useMutation({
    mutationFn: (id) => voidAffiliatePayoutApi(id),
    onSuccess: (payout) => {
      queryClient.invalidateQueries({ queryKey: ['affiliate-payouts'] });
      queryClient.setQueryData(['affiliate-payout', payout?._id], payout);
      toast.success('Payout voided');
    },
    onError: (error) => {
      toast.error(error.message || 'Payout could not be voided');
    },
  });

  return { voidPayout, isVoidingPayout };
}
