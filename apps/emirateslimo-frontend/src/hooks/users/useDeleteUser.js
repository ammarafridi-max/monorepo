'use client';
import { useMutation } from '@tanstack/react-query';
import { deleteUserApi } from '@/services/apiUsers';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

export function useDeleteUser(username) {
  const router = useRouter();
  const { mutate: deleteUser, isPending: isDeleting } = useMutation({
    mutationKey: ['user'],
    mutationFn: () => deleteUserApi(username),
    onSuccess: () => {
      toast.success('User deleted successfully!');
      router.push('/admin/users');
    },
    onError: () => {
      toast.error('User could not be deleted');
    },
  });

  return { deleteUser, isDeleting };
}
