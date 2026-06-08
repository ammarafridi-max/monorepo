'use client';

import { useMutation } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { createBookingApi, getPaymentLinkApi } from '@/services/apiBooking';

export function useCreateBooking() {
  const { mutate: createBooking, isPending: isCreatingBooking } = useMutation({
    mutationFn: async (formData) => {
      const booking = await createBookingApi(formData);
      if (!booking?._id) throw new Error('Booking creation failed');

      const paymentData = await getPaymentLinkApi(booking._id);

      if (!paymentData) throw new Error('Failed to retrieve payment link');

      window.location.href = paymentData;
    },
    onError: (err) => {
      toast.error(err.message || 'Booking failed');
    },
  });

  return {
    createBooking,
    isCreatingBooking,
  };
}
