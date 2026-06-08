'use client';
import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getUsers } from '@/services/apiUsers';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

export function useUsers() {
  const router = useRouter();
  const {
    data: users,
    isLoading: isLoadingUsers,
    error,
  } = useQuery({
    queryKey: ['users'],
    queryFn: () => getUsers(),
  });

  useEffect(() => {
    if (error) {
      toast.error(error.message);
      const timer = setTimeout(() => {
        router.push('/admin');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [error, router]);

  return {
    users,
    isLoadingUsers,
    error,
  };
}
