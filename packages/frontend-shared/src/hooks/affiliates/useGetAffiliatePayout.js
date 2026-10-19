'use client';
import { useQuery } from '@tanstack/react-query';
import { getAffiliatePayoutApi } from '../../services/apiAffiliates.js';

export function useGetAffiliatePayout(id) {
  const {
    data: payout,
    isLoading: isLoadingPayout,
    isError: isErrorPayout,
  } = useQuery({
    queryKey: ['affiliate-payout', id],
    queryFn: () => getAffiliatePayoutApi(id),
    enabled: Boolean(id),
  });

  return { payout, isLoadingPayout, isErrorPayout };
}
