'use client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { markAffiliatePayoutPaidApi } from '../../services/apiAffiliates.js';

export function useMarkAffiliatePayoutPaid() {
  const queryClient = useQueryClient();

  const { mutate: markPayoutPaid, isPending: isMarkingPayoutPaid } = useMutation({
    mutationFn: ({ id, payload }) => markAffiliatePayoutPaidApi(id, payload),
    onSuccess: (payout) => {
      queryClient.invalidateQueries({ queryKey: ['affiliate-payouts'] });
      queryClient.setQueryData(['affiliate-payout', payout?._id], payout);
      toast.success('Payout recorded as paid');
    },
    onError: (error) => {
      toast.error(error.message || 'Payout could not be marked as paid');
    },
  });

  return { markPayoutPaid, isMarkingPayoutPaid };
}
