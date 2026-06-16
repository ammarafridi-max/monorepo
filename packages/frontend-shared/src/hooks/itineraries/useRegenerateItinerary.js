'use client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { regenerateItineraryApi } from '../../services/apiItineraries.js';

// Regenerates the itinerary for an existing order (pre-payment). The server
// enforces the free-regeneration cap and returns 429 once it is exhausted.
export function useRegenerateItinerary(sessionId) {
  const queryClient = useQueryClient();

  const { mutate: regenerateItinerary, isPending: isRegeneratingItinerary } = useMutation({
    mutationFn: () => regenerateItineraryApi(sessionId),
    onSuccess: (data) => {
      queryClient.setQueryData(['itinerary', sessionId], data);
    },
    onError: (err) => toast.error(err.message),
  });

  return { regenerateItinerary, isRegeneratingItinerary };
}
