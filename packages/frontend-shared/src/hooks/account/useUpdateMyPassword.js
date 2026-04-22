'use client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updatePasswordApi } from '../../services/apiAccount.js';
import { useAdminAuth } from '../../contexts/AdminAuthContext.js';
import toast from 'react-hot-toast';

export function useUpdateMyPassword() {
  const queryClient = useQueryClient();
  const { refreshAdminUser } = useAdminAuth();
  const { mutateAsync: updatePassword, isPending: isUpdating } = useMutation({
    mutationKey: ['account'],
    mutationFn: (data) => updatePasswordApi(data),
    onSuccess: async () => {
      toast.success('Password updated successfully!');
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['account'] }),
        refreshAdminUser(),
      ]);
    },
    onError: () => {
      toast.error('Could not update password.');
    },
  });

  return { updatePassword, isUpdating };
}
