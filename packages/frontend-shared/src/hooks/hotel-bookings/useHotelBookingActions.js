'use client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  cancelHotelBookingApi,
  retryHotelBookingApi,
  updateHotelBookingStatusApi,
  deleteHotelBookingApi,
} from '../../services/apiHotelBookings.js';

function useReservationMutation({ mutationFn, success }) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: (data, variables) => {
      const sessionId = typeof variables === 'string' ? variables : variables?.sessionId;
      queryClient.invalidateQueries({ queryKey: ['hotelBookings'] });
      queryClient.invalidateQueries({ queryKey: ['hotelBooking', sessionId] });
      toast.success(success);
    },
    onError: (err) => toast.error(err.message),
  });
}

export function useCancelHotelBooking() {
  const { mutate, isPending } = useReservationMutation({
    mutationFn: cancelHotelBookingApi,
    success: 'Reservation cancelled',
  });
  return { cancelReservation: mutate, isCancelling: isPending };
}

export function useRetryHotelBooking() {
  const { mutate, isPending } = useReservationMutation({
    mutationFn: retryHotelBookingApi,
    success: 'Booking retried',
  });
  return { retryBooking: mutate, isRetrying: isPending };
}

export function useUpdateHotelBookingStatus() {
  const { mutate, isPending } = useReservationMutation({
    mutationFn: updateHotelBookingStatusApi,
    success: 'Status updated',
  });
  return { updateStatus: mutate, isUpdatingStatus: isPending };
}

export function useDeleteHotelBooking() {
  const { mutate, isPending } = useReservationMutation({
    mutationFn: deleteHotelBookingApi,
    success: 'Reservation deleted',
  });
  return { deleteReservation: mutate, isDeleting: isPending };
}
