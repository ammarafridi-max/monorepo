'use client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  updateHotelBookingStatusApi,
  deleteHotelBookingApi,
  sendHotelReservationApi,
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

export function useSendHotelReservation() {
  const { mutate, isPending } = useReservationMutation({
    mutationFn: sendHotelReservationApi,
    success: 'Reservation sent',
  });
  return { sendReservation: mutate, isSending: isPending };
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
