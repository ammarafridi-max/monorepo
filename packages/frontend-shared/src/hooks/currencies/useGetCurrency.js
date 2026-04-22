'use client';
import { useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { getCurrencyApi } from '../../services/apiCurrencies.js';

export function useGetCurrency(code) {
  const {
    data: currency = null,
    isLoading: isLoadingCurrency,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['currency', code],
    queryFn: () => getCurrencyApi(code),
    enabled: !!code,
    staleTime: 1000 * 60 * 5,
    retry: 1,
    onError: () => {
      toast.error('Failed to fetch currency');
    },
  });

  return { currency, isLoadingCurrency, isError, error, refetch };
}
