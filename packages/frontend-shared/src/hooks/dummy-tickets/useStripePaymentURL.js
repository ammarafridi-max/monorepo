'use client';
import { useMutation } from '@tanstack/react-query';
import { getStripePaymentURL } from '../../services/apiDummyTickets.js';

export function useStripePaymentURL() {
  const {
    mutate: createStripePayment,
    isPending: isLoadingStripePaymentURL,
    isError: isErrorStripePaymentURL,
    error,
  } = useMutation({
    mutationFn: getStripePaymentURL,
    onSuccess: (url) => {
      window.location.href = url;
    },
  });

  return {
    createStripePayment,
    isLoadingStripePaymentURL,
    isErrorStripePaymentURL,
    error,
  };
}
