'use client';
import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { createItineraryApi } from '../../services/apiItineraries.js';

// Generates the first itinerary for a new order, then routes to the
// preview/pay page. Pass `onAnalytics` to fire tracking on success.
export function useGenerateItinerary({ onAnalytics } = {}) {
  const router = useRouter();

  const { mutate: generateItinerary, isPending: isGeneratingItinerary } = useMutation({
    mutationFn: (input) => createItineraryApi(input),
    onSuccess: (data, variables) => {
      if (typeof onAnalytics === 'function') onAnalytics({ ...variables, sessionId: data?.sessionId });
      if (data?.sessionId) router.push(`/itinerary-booking/${data.sessionId}`);
    },
    onError: (err) => toast.error(err.message),
  });

  return { generateItinerary, isGeneratingItinerary };
}
