'use client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { generateAffiliatePayoutsApi } from '../../services/apiAffiliates.js';

export function useGenerateAffiliatePayouts() {
  const queryClient = useQueryClient();

  const {
    mutate: generatePayouts,
    isPending: isGeneratingPayouts,
    data: generatedRun,
    reset: resetGeneratedRun,
  } = useMutation({
    mutationFn: (payload) => generateAffiliatePayoutsApi(payload),
    onSuccess: (run) => {
      queryClient.invalidateQueries({ queryKey: ['affiliate-payouts'] });
      const claimed = run?.payouts?.filter((p) => p.claimed).length ?? 0;
      toast.success(
        claimed > 0
          ? `${claimed} new payout${claimed === 1 ? '' : 's'} created for ${run?.period}`
          : `No new payouts for ${run?.period}, everything was already claimed`,
      );
    },
    onError: (error) => {
      toast.error(error.message || 'Payouts could not be generated');
    },
  });

  return { generatePayouts, isGeneratingPayouts, generatedRun, resetGeneratedRun };
}
