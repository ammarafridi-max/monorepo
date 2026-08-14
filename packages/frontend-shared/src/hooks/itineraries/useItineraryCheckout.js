'use client';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { checkoutItineraryApi } from '../../services/apiItineraries.js';

export function useItineraryCheckout() {
  const {
    mutate: startItineraryCheckout,
    isPending: isStartingCheckout,
    isError: isCheckoutError,
    error,
  } = useMutation({
    mutationFn: (sessionId) => checkoutItineraryApi(sessionId),
    onSuccess: (url) => {
      if (url) window.location.href = url;
    },
    onError: (err) => toast.error(err.message),
  });

  return { startItineraryCheckout, isStartingCheckout, isCheckoutError, error };
}
