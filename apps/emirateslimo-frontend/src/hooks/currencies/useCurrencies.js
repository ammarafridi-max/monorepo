'use client';
import { useQuery } from '@tanstack/react-query';
import { getCurrenciesApi } from '@/services/apiCurrencies';

export function useCurrencies() {
  const {
    data: currencies,
    isLoading: isLoadingCurrencies,
    isError,
  } = useQuery({
    queryKey: ['currencies'],
    queryFn: getCurrenciesApi,
  });

  return { currencies, isLoadingCurrencies, isError };
}

export function useCurrencyByCode(code) {
  const { data: currencies, isLoading: isLoadingCurrencies } = useQuery({
    queryKey: ['currencies'],
    queryFn: getCurrenciesApi,
  });

  const currency = (currencies || []).find((cur) => cur.code === code) || null;

  return { currency, isLoadingCurrency: isLoadingCurrencies };
}
