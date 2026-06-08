'use client';
import { useQuery } from '@tanstack/react-query';
import { getCurrencyApi } from '@/services/apiCurrencies';

export function useCurrency(id) {
  const {
    data: currency = null,
    isLoading: isLoadingCurrency,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['currency', id],
    queryFn: () => getCurrencyApi(id),
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
    retry: 1,
  });

  return { currency, isLoadingCurrency, isError, error, refetch };
}
