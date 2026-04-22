'use client';
import { useQuery } from '@tanstack/react-query';
import { getCurrenciesApi } from '../../services/apiCurrencies.js';

export function useGetCurrencies(params = {}) {
  const { data: currencies, isLoading: isLoadingCurrencies, isError } = useQuery({
    queryKey: ['currencies', params],
    queryFn: () => getCurrenciesApi(params),
    placeholderData: (prev) => prev,
  });

  return { currencies, isLoadingCurrencies, isError };
}

export function useGetCurrencyByCode(code) {
  const { data: currencies, isLoading: isLoadingCurrencies } = useQuery({
    queryKey: ['currencies'],
    queryFn: () => getCurrenciesApi(),
  });

  const currency = (currencies || []).find((cur) => cur.code === code) || null;
  return { currency, isLoadingCurrency: isLoadingCurrencies };
}
