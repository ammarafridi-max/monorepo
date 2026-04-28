'use client';
import { useQuery } from '@tanstack/react-query';
import { listChargesApi } from '../../services/apiPayments.js';

export function useCharges({ from, to, limit = 25 }) {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['admin-charges', from, to, limit],
    queryFn: () => listChargesApi({ from, to, limit }),
    enabled: Boolean(from && to),
  });
  return {
    charges: data?.items ?? [],
    hasMore: data?.hasMore ?? false,
    isLoadingCharges: isLoading,
    isErrorCharges: isError,
    chargesError: error,
  };
}
