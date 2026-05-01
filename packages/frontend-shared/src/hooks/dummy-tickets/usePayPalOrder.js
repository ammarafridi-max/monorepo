'use client';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { createPayPalOrderApi } from '../../services/apiDummyTickets.js';

export function usePayPalOrder() {
  const {
    mutate: createPayPalOrder,
    isPending: isLoadingPayPalOrder,
    isError: isErrorPayPalOrder,
    error,
  } = useMutation({
    mutationFn: createPayPalOrderApi,
    onSuccess: ({ approveUrl }) => {
      window.location.href = approveUrl;
    },
    onError: (err) => {
      toast.error(err.message || 'Could not start PayPal checkout. Please try again.');
    },
  });

  return { createPayPalOrder, isLoadingPayPalOrder, isErrorPayPalOrder, error };
}
