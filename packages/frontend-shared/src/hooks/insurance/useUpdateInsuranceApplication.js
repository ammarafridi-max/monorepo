'use client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { updateInsuranceApplicationApi } from '../../services/apiInsurance.js';

export function useUpdateInsuranceApplication() {
  const queryClient = useQueryClient();

  const { mutate: updateInsuranceApplication, isPending: isUpdatingApplication } = useMutation({
    mutationFn: ({ sessionId, paymentStatus }) => updateInsuranceApplicationApi({ sessionId, paymentStatus }),
    onSuccess: () => {
      toast.success('Insurance application updated successfully.');
      queryClient.invalidateQueries({ queryKey: ['insuranceApplications'] });
      queryClient.invalidateQueries({ queryKey: ['insuranceApplication'] });
      queryClient.invalidateQueries({ queryKey: ['insuranceApplicationsSummary'] });
    },
    onError: () => {
      toast.error('An error occurred.');
    },
  });

  return { updateInsuranceApplication, isUpdatingApplication };
}
