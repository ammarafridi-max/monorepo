'use client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { refundBookingApi } from '@/services/apiBooking';
import toast from 'react-hot-toast';

export function useRefundBooking() {
  const queryClient = useQueryClient();

  const { mutate: refundBooking, isPending: isRefunding } = useMutation({
    mutationFn: (transactionId) => refundBookingApi(transactionId),
    onSuccess: () => {
      toast.success('Payment refunded successfully');
      queryClient.invalidateQueries(['bookings']);
      queryClient.invalidateQueries(['booking']);
    },
    onError: (err) => {
      toast.error(err.message || 'Could not refund');
    },
  });

  return { refundBooking, isRefunding };
}
