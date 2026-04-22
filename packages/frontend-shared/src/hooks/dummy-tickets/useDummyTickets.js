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
  });

  return {
    dummyTickets: data?.data,
    pagination: data?.pagination,
    results: data?.results,
    isLoadingDummyTickets,
    isErrorDummyTickets,
  };
}
