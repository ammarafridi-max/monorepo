'use client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateAccountApi } from '../../services/apiAccount.js';
import { useAdminAuth } from '../../contexts/AdminAuthContext.js';
import toast from 'react-hot-toast';

export function useUpdateMyAccount() {
  const queryClient = useQueryClient();
  const { refreshAdminUser } = useAdminAuth();
  const { mutateAsync: updateAccount, isPending: isUpdating } = useMutation({
    mutationKey: ['account'],
    mutationFn: (data) => updateAccountApi(data),
    onSuccess: async () => {
      toast.success('Account updated successfully');
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['account'] }),
        refreshAdminUser(),
      ]);
    },
    onError: () => {
      toast.error('An error occurred while updating your account');
    },
  });

  return { updateAccount, isUpdating };
}
