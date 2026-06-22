'use client';
import { useQuery } from '@tanstack/react-query';
import { getDummyTicketsApi } from '../../services/apiDummyTickets.js';
import { useSearchParams } from 'next/navigation';

export function useDummyTickets() {
  const searchParams = useSearchParams();
  const params = Object.fromEntries([...searchParams]);

  const {
    data,
    isLoading: isLoadingDummyTickets,
    isError: isErrorDummyTickets,
  } = useQuery({
    queryKey: ['dummytickets', params],
    queryFn: () => getDummyTicketsApi(params),
    placeholderData: (prev) => prev,
    // Belt-and-suspenders: even without a ping-triggered invalidation,
    // returning to the tab should refetch so the admin never sees stale rows.
    refetchOnWindowFocus: true,
    staleTime: 0,
  });

  return {
    dummyTickets: data?.data,
    pagination: data?.pagination,
    results: data?.results,
    isLoadingDummyTickets,
    isErrorDummyTickets,
  };
}
