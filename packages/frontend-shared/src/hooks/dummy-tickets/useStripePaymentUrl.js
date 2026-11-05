'use client';
import { useMutation } from '@tanstack/react-query';
import { getStripePaymentUrl } from '../../services/apiDummyTickets.js';

export function useStripePaymentUrl() {
  const {
    mutate: createStripePayment,
    isPending: isLoadingStripePaymentUrl,
    isError: isErrorStripePaymentUrl,
    error,
  } = useMutation({
    mutationFn: getStripePaymentUrl,
    onSuccess: (url) => {
      window.location.href = url;
    },
  });

  return {
    createStripePayment,
    isLoadingStripePaymentUrl,
    isErrorStripePaymentUrl,
    error,
  };
}
