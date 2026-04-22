'use client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createAdminUserApi } from '../../services/apiAdminUsers.js';
import toast from 'react-hot-toast';

export function useCreateAdminUser() {
  const queryClient = useQueryClient();
  const { mutate: createUser, isPending: isCreating } = useMutation({
    mutationFn: createAdminUserApi,
    onSuccess: () => {
      toast.success('User created successfully!');
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    },
    onError: (err) => {
      toast.error(err.message || 'User could not be created');
    },
  });

  return { createUser, isCreating };
}
