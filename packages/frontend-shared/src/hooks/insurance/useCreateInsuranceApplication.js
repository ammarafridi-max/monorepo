'use client';
import { useMutation } from '@tanstack/react-query';
import { createInsuranceApplicationApi } from '../../services/apiInsurance.js';
import toast from 'react-hot-toast';

export function useCreateInsuranceApplication() {
  const { mutate, isPending } = useMutation({
    mutationFn: (payload) => createInsuranceApplicationApi(payload),
    onError: (err) => {
      toast.error(err.message || 'Could not save your application. Please try again.');
    },
  });

  return {
    createInsuranceApplication: mutate,
    isCreatingApplication: isPending,
  };
}
