'use client';
import { useQuery } from '@tanstack/react-query';
import { getAffiliatePayoutsApi } from '../../services/apiAffiliates.js';

export function useGetAffiliatePayouts(params = {}) {
  const {
    data,
    isLoading: isLoadingPayouts,
    isError: isErrorPayouts,
    isFetching: isFetchingPayouts,
  } = useQuery({
    queryKey: ['affiliate-payouts', params],
    queryFn: () => getAffiliatePayoutsApi(params),
    placeholderData: (prev) => prev,
  });

  return {
    payouts: data?.payouts || [],
    pagination: data?.pagination,
    isLoadingPayouts,
    isErrorPayouts,
    isFetchingPayouts,
  };
}
