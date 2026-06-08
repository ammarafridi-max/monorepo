'use client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { updateBookingApi } from '../../services/apiLimoBookings.js';

export function useUpdateBooking() {
  const queryClient = useQueryClient();

  const { mutate: updateBooking, isPending: isUpdatingBooking } = useMutation({
    mutationFn: ({ id, bookingData }) => updateBookingApi(id, bookingData),
    onSuccess: () => {
      toast.success('Booking updated successfully');
      queryClient.invalidateQueries({ queryKey: ['limo-bookings'] });
    },
    onError: (err) => {
      toast.error(err.message || 'Booking could not be updated');
    },
  });

  return { updateBooking, isUpdatingBooking };
}
