'use client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateAdminUserApi } from '../../services/apiAdminUsers.js';
import toast from 'react-hot-toast';

export function useUpdateAdminUser() {
  const queryClient = useQueryClient();
  const { mutate: updateUser, isPending: isUpdating } = useMutation({
    mutationFn: ({ username, userData }) => updateAdminUserApi(username, userData),
    onSuccess: () => {
      toast.success('User updated successfully');
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    },
    onError: (err) => {
      toast.error(err.message || 'User could not be updated');
    },
  });

  return { updateUser, isUpdating };
}
