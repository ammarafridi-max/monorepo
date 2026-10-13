'use client';
import { useMutation } from '@tanstack/react-query';
import { createHotelCheckoutApi } from '../../services/apiHotelBookings.js';

export function useHotelStripePaymentURL() {
  const {
    mutate: createHotelStripePayment,
    isPending: isLoadingHotelPaymentURL,
    isError: isErrorHotelPaymentURL,
    error,
  } = useMutation({
    mutationFn: createHotelCheckoutApi,
    onSuccess: (url) => {
      window.location.href = url;
    },
  });

  return { createHotelStripePayment, isLoadingHotelPaymentURL, isErrorHotelPaymentURL, error };
}
