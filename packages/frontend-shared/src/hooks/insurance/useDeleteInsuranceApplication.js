'use client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deleteInsuranceApplicationApi } from '../../services/apiInsurance.js';
import toast from 'react-hot-toast';

export function useDeleteInsuranceApplication() {
  const queryClient = useQueryClient();

  const { mutate: deleteInsuranceApplication, isPending: isDeleting } = useMutation({
    mutationFn: (sessionId) => deleteInsuranceApplicationApi(sessionId),
    onSuccess: () => {
      toast.success('Insurance application deleted successfully');
      queryClient.removeQueries({ queryKey: ['insuranceApplications'], exact: false });
      queryClient.removeQueries({ queryKey: ['insuranceApplication'], exact: false });
    },
    onError: () => {
      toast.error('Could not delete insurance application');
    },
  });

  return { deleteInsuranceApplication, isDeleting };
}
