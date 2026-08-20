'use client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { updateBookingStatusApi } from '../../services/apiBookings.js';

export function useUpdateBookingStatus() {
  const queryClient = useQueryClient();

  const { mutate: updateBookingStatus, isPending: isUpdatingStatus } = useMutation({
    mutationFn: ({ id, status }) => updateBookingStatusApi(id, status),
    onSuccess: (updated, { id }) => {
      toast.success('Booking status updated');
      queryClient.setQueryData(['bookings', 'detail', id], updated);
      queryClient.invalidateQueries({ queryKey: ['bookings', 'list'] });
      queryClient.invalidateQueries({ queryKey: ['bookings', 'detail', id] });
    },
    onError: (err) => {
      toast.error(err?.message || 'Booking status could not be updated');
    },
  });

  return { updateBookingStatus, isUpdatingStatus };
}
