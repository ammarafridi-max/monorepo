'use client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { deleteBookingApi } from '../../services/apiLimoBookings.js';

export function useDeleteBooking() {
  const queryClient = useQueryClient();

  const { mutate: deleteBooking, isPending: isDeletingBooking } = useMutation({
    mutationFn: (id) => deleteBookingApi(id),
    onSuccess: () => {
      toast.success('Booking deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['limo-bookings'] });
    },
    onError: (err) => {
      toast.error(err.message || 'Booking could not be deleted');
    },
  });

  return { deleteBooking, isDeletingBooking };
}
