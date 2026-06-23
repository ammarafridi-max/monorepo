'use client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { deleteItineraryOrderApi } from '../../services/apiItineraries.js';

// Admin: delete an itinerary. Refreshes the list and (from the detail page)
// routes back to the list. Pass { redirect: false } to stay put (list page).
export function useDeleteItineraryOrder({ redirect = true } = {}) {
  const queryClient = useQueryClient();
  const router = useRouter();

  const { mutate: deleteItineraryOrder, isPending: isDeleting } = useMutation({
    mutationFn: (sessionId) => deleteItineraryOrderApi(sessionId),
    onSuccess: () => {
      toast.success('Itinerary deleted');
      queryClient.invalidateQueries({ queryKey: ['itinerary-orders'], exact: false });
      queryClient.removeQueries({ queryKey: ['itinerary-order-detail'], exact: false });
      if (redirect) router.push('/admin/itineraries');
    },
    onError: (err) => toast.error(err.message || 'Could not delete itinerary'),
  });

  return { deleteItineraryOrder, isDeleting };
}
