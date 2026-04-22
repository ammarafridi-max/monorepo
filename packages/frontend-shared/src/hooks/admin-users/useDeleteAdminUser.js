'use client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deleteAdminUserApi } from '../../services/apiAdminUsers.js';
import toast from 'react-hot-toast';

export function useDeleteAdminUser(username) {
  const queryClient = useQueryClient();
  const { mutate: deleteUser, isPending: isDeleting } = useMutation({
    mutationKey: ['admin-user', username],
    mutationFn: () => deleteAdminUserApi(username),
    onSuccess: () => {
      toast.success('User deleted successfully!');
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    },
    onError: () => {
      toast.error('User could not be deleted');
    },
  });

  return { deleteUser, isDeleting };
}
