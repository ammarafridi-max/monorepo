'use client';
import { useQuery } from '@tanstack/react-query';
import { getMyAccountApi } from '@/services/apiAccount';

export function useGetMyAccount() {
  const { data: account, isLoading } = useQuery({
    queryKey: ['account'],
    queryFn: getMyAccountApi,
  });

  return { account, isLoading };
}
