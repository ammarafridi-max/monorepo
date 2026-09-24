'use client';
import { useQuery } from '@tanstack/react-query';
import { getDummyTicketPricingApi } from '../../services/apiPricing.js';

export function useDummyTicketPricing(currency) {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['dummy-ticket-pricing', currency || null],
    queryFn: () => getDummyTicketPricingApi(currency),
  });

  return {
    pricing: data,
    isLoadingPricing: isLoading,
    isErrorPricing: isError,
    pricingError: error,
  };
}
