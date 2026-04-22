'use client';
import { useQuery } from '@tanstack/react-query';
import { getDummyTicketPricingApi } from '../../services/apiPricing.js';

export function useDummyTicketPricing() {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['dummy-ticket-pricing'],
    queryFn: getDummyTicketPricingApi,
  });

  return {
    pricing: data,
    isLoadingPricing: isLoading,
    isErrorPricing: isError,
    pricingError: error,
  };
}
