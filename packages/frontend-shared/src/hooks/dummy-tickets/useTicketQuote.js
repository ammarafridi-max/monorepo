'use client';
import { useQuery } from '@tanstack/react-query';
import { getTicketQuoteApi } from '../../services/apiDummyTickets.js';

export function useTicketQuote(sessionId, currencyCode) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['dummy-ticket-quote', sessionId, currencyCode || null],
    queryFn: () => getTicketQuoteApi(sessionId, currencyCode),
    enabled: Boolean(sessionId),
  });

  return { quote: data, isLoadingQuote: isLoading, isErrorQuote: isError };
}
