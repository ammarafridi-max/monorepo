'use client';
import { useQuery } from '@tanstack/react-query';
import { getItineraryOrderDetailApi } from '../../services/apiItineraries.js';

// Admin: full itinerary order detail (incl. Cloudinary document URLs).
export function useItineraryOrderDetail(sessionId) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['itinerary-order-detail', sessionId],
    queryFn: () => getItineraryOrderDetailApi(sessionId),
    enabled: !!sessionId,
    refetchOnWindowFocus: true,
  });

  return { order: data, isLoadingOrder: isLoading, isErrorOrder: isError };
}
