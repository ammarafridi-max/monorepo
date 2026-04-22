'use client';
import { useQuery } from '@tanstack/react-query';
import { getDummyTicketApi } from '../../services/apiDummyTickets.js';

export function useGetDummyTicket(sessionId) {
  const {
    data,
    isLoading: isLoadingDummyTicket,
    isError: isErrorDummyTicket,
  } = useQuery({
    queryKey: ['dummyticket', sessionId],
    queryFn: () => getDummyTicketApi(sessionId),
    enabled: !!sessionId,
  });

  return {
    dummyTicket: data,
    isLoadingDummyTicket,
    isErrorDummyTicket,
  };
}
