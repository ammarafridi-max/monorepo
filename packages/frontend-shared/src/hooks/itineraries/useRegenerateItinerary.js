'use client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { regenerateItineraryApi } from '../../services/apiItineraries.js';

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
