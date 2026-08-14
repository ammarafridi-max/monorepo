'use client';
import { useQuery } from '@tanstack/react-query';
import { getItineraryOrderApi } from '../../services/apiItineraries.js';

export function useItineraryOrder(sessionId, { refetchInterval } = {}) {
  const {
    data: order,
    isLoading: isLoadingOrder,
    isError: isErrorOrder,
    refetch: refetchOrder,
  } = useQuery({
    queryKey: ['itinerary', sessionId],
    queryFn: () => getItineraryOrderApi(sessionId),
    enabled: !!sessionId,
    refetchInterval,
  });

  return { order, isLoadingOrder, isErrorOrder, refetchOrder };
}
