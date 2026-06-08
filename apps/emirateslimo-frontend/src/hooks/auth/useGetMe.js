'use client';
import { useQuery } from '@tanstack/react-query';
import { getMeApi } from '@/services/apiAuth';

export function useGetMe() {
  const { data: myAccount, isLoading: isLoadingMyAccount } = useQuery({
    queryKey: ['me'],
    queryFn: getMeApi,
    retry: false,
  });

  return { myAccount, isLoadingMyAccount };
}
