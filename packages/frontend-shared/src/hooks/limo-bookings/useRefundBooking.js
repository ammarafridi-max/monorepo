'use client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { refundBookingApi } from '../../services/apiLimoBookings.js';

export function useRefundBooking() {
  const queryClient = useQueryClient();

  const { mutate: refundBooking, isPending: isRefundingBooking } = useMutation({
    mutationFn: (transactionId) => refundBookingApi(transactionId),
    onSuccess: () => {
      toast.success('Payment refunded successfully');
      queryClient.invalidateQueries({ queryKey: ['limo-bookings'] });
    },
    onError: (err) => {
      toast.error(err.message || 'Payment could not be refunded');
    },
  });

  return { refundBooking, isRefundingBooking };
}
