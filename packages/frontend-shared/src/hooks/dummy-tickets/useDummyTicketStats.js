'use client';
import { useQuery } from '@tanstack/react-query';
import { getDummyTicketStatsApi } from '../../services/apiDummyTickets.js';

export function useDummyTicketStats(params = {}, options = {}) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['dummyticket-stats', params],
    queryFn: () => getDummyTicketStatsApi(params),
    placeholderData: (prev) => prev,
    ...options,
  });

  return { stats: data, isLoadingStats: isLoading, isErrorStats: isError };
}
