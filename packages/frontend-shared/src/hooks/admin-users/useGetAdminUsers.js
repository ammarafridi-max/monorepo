'use client';
import { useQuery } from '@tanstack/react-query';
import { getAdminUsersApi } from '../../services/apiAdminUsers.js';

export function useGetAdminUsers(params = {}, options = {}) {
  const {
    data: users,
    isLoading: isLoadingUsers,
    error,
  } = useQuery({
    queryKey: ['admin-users', params],
    queryFn: () => getAdminUsersApi(params),
    placeholderData: (prev) => prev,
    ...options,
  });

  return {
    users,
    isLoadingUsers,
    error,
  };
}
