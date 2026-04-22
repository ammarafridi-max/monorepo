'use client';
import { useQuery } from '@tanstack/react-query';
import { getAdminUserApi } from '../../services/apiAdminUsers.js';
import toast from 'react-hot-toast';

export function useGetAdminUser(username) {
  const {
    data: user = null,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['admin-user', username],
    queryFn: () => getAdminUserApi(username),
    enabled: !!username,
    staleTime: 1000 * 60 * 5,
    retry: 1,
    onError: (err) => {
      console.error('Admin user fetch failed:', err);
      toast.error('Failed to fetch user');
    },
  });

  return { user, isLoading, isError, error, refetch };
}
