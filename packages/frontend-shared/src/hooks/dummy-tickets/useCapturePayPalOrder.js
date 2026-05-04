'use client';
import { useMutation } from '@tanstack/react-query';
import { capturePayPalOrderApi } from '../../services/apiDummyTickets.js';

export function useCapturePayPalOrder() {
  const {
    mutate: capturePayPalOrder,
    isPending: isCapturing,
    isError: isErrorCapture,
    isSuccess: isCaptureSuccess,
    error,
  } = useMutation({
    mutationFn: capturePayPalOrderApi,
    retry: 0,
  });

  return { capturePayPalOrder, isCapturing, isErrorCapture, isCaptureSuccess, error };
}
