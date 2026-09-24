'use client';
import { useQuery } from '@tanstack/react-query';
import {
  getAdminDummyTicketPricingApi,
  getAdminDummyTicketPriceBooksApi,
} from '../../services/apiPricing.js';

export function useAdminDummyTicketPricing(currency) {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['admin-dummy-ticket-pricing', currency || null],
    queryFn: () => getAdminDummyTicketPricingApi(currency),
    placeholderData: (prev) => prev,
  });

  return {
    pricing: data,
    isLoadingPricing: isLoading,
    isErrorPricing: isError,
    pricingError: error,
  };
}

export function useAdminDummyTicketPriceBooks() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-dummy-ticket-price-books'],
    queryFn: getAdminDummyTicketPriceBooksApi,
  });

  return { priceBooks: data || [], isLoadingPriceBooks: isLoading };
}
