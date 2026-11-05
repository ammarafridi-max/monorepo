'use client';
import { useMutation } from '@tanstack/react-query';
import { createHotelCheckoutApi } from '../../services/apiHotelBookings.js';

export function useHotelStripePaymentUrl() {
  const {
    mutate: createHotelStripePayment,
    isPending: isLoadingHotelPaymentUrl,
    isError: isErrorHotelPaymentUrl,
    error,
  } = useMutation({
    mutationFn: createHotelCheckoutApi,
    onSuccess: (url) => {
      window.location.href = url;
    },
  });

  return { createHotelStripePayment, isLoadingHotelPaymentUrl, isErrorHotelPaymentUrl, error };
}
