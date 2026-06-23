'use client';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'next/navigation';
import { getItineraryOrdersApi } from '../../services/apiItineraries.js';

// Admin list of itinerary orders, driven by the URL search params (search,
// filters, page) — mirrors useDummyTickets.
export function useItineraryOrders() {
  const searchParams = useSearchParams();
  const params = Object.fromEntries([...searchParams]);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['itinerary-orders', params],
    queryFn: () => getItineraryOrdersApi(params),
    placeholderData: (prev) => prev,
    refetchOnWindowFocus: true,
    staleTime: 0,
  });

  return {
    orders: data?.data ?? [],
    pagination: data?.pagination,
    isLoadingOrders: isLoading,
    isErrorOrders: isError,
  };
}
