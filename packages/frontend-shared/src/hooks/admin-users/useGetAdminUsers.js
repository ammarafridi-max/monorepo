'use client';
import { useQuery } from '@tanstack/react-query';
import { getAdminUsersApi } from '../../services/apiAdminUsers.js';

export function useGetAdminUsers(params = {}) {
  const {
    data: users,
    isLoading: isLoadingUsers,
    error,
  } = useQuery({
    queryKey: ['admin-users', params],
    queryFn: () => getAdminUsersApi(params),
    placeholderData: (prev) => prev,
  });

  return {
    users,
    isLoadingUsers,
    error,
  };
}
