'use client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { resendPolicyEmailApi } from '../../services/apiInsurance.js';

export function useResendPolicyEmail() {
  const queryClient = useQueryClient();

  const { mutate: resendPolicyEmail, isPending: isResendingPolicyEmail } = useMutation({
    mutationFn: (sessionId) => resendPolicyEmailApi(sessionId),
    onSuccess: (res) => {
      toast.success(res?.message || 'Policy email sent.');
      queryClient.invalidateQueries({ queryKey: ['insuranceApplication'] });
    },
    onError: (err) => {
      toast.error(err?.message || 'Policy email failed.');
      queryClient.invalidateQueries({ queryKey: ['insuranceApplication'] });
    },
  });

  return { resendPolicyEmail, isResendingPolicyEmail };
}
