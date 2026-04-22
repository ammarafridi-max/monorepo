'use client';
import { useMutation } from '@tanstack/react-query';
import { finalizeInsuranceApi } from '../../services/apiInsurance.js';
import toast from 'react-hot-toast';

export function useFinalizeInsurance() {
  const { mutate, isPending } = useMutation({
    mutationFn: ({
      sessionId,
      quoteId,
      schemeId,
      journeyType,
      startDate,
      endDate,
      region,
      quantity,
      passengers,
      email,
      mobile,
      streetAddress,
      addressLine2,
      city,
      country,
      currency,
    }) =>
      finalizeInsuranceApi({
        sessionId,
        quoteId,
        schemeId,
        journeyType,
        startDate,
        endDate,
        region,
        quantity,
        passengers,
        email,
        mobile,
        streetAddress,
        addressLine2,
        city,
        country,
        currency,
      }),
    onError: (err) => {
      toast.error(err.message || 'Something went wrong. Please try again.');
    },
  });

  return {
    finalizeInsurance: mutate,
    isFinalizing: isPending,
  };
}
