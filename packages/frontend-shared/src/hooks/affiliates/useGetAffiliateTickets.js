'use client';
import { useQuery } from '@tanstack/react-query';
import { getAffiliateTicketsApi } from '../../services/apiAffiliates.js';

export function useGetAffiliateTickets(id, params = {}) {
  const {
    data,
    isLoading: isLoadingAffiliateTickets,
    isError: isErrorAffiliateTickets,
  } = useQuery({
    queryKey: ['affiliate-tickets', id, params],
    queryFn: () => getAffiliateTicketsApi(id, params),
    enabled: Boolean(id),
    placeholderData: (prev) => prev,
  });

  return {
    tickets: data?.tickets || [],
    pagination: data?.pagination,
    isLoadingAffiliateTickets,
    isErrorAffiliateTickets,
  };
}
