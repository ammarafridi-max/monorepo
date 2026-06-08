'use client';
import { useMutation } from '@tanstack/react-query';
import { updateUserApi } from '@/services/apiUsers';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

export function useUpdateUser() {
  const router = useRouter();
  const { mutate: updateUser, isPending: isUpdating } = useMutation({
    mutationFn: ({ username, userData }) => updateUserApi(username, userData),
    onSuccess: () => {
      toast.success('User updated successfully');
      router.push('/admin/users');
    },
    onError: () => {
      toast.error('User could not be updated');
    },
  });

  return { updateUser, isUpdating };
}
