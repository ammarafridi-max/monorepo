'use client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { skipEmailApi } from '../../services/apiEmailSupport.js';

export function useSkipEmail() {
  const queryClient = useQueryClient();

  const { mutate: skipEmail, isPending: isSkippingEmail } = useMutation({
    mutationFn: (id) => skipEmailApi(id),
    onSuccess: () => {
      toast.success('Email skipped');
      queryClient.invalidateQueries({ queryKey: ['email-support'] });
    },
    onError: (err) => {
      toast.error(err.message || 'Failed to skip email');
    },
  });

  return { skipEmail, isSkippingEmail };
}
