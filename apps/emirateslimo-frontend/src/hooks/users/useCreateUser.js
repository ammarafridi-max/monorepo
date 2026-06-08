'use client';
import { useMutation } from '@tanstack/react-query';
import { createUserApi } from '@/services/apiUsers';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

export function useCreateUser() {
  const router = useRouter();
  const { mutate: createUser, isPending: isCreating } = useMutation({
    mutationFn: createUserApi,
    onSuccess: () => {
      toast.success('User created successfully!');
      router.push('/admin/users');
    },
    onError: () => {
      toast.error('User could not be created');
    },
  });

  return { createUser, isCreating };
}
