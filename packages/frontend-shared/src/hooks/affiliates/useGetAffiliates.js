'use client';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'next/navigation';
import { getAffiliatesApi } from '../../services/apiAffiliates.js';

export function useGetAffiliates() {
  const searchParams = useSearchParams();
  const params = Object.fromEntries([...searchParams]);

  const {
    data,
    isLoading: isLoadingAffiliates,
    isError: isErrorAffiliates,
  } = useQuery({
    queryKey: ['affiliates', params],
    queryFn: () => getAffiliatesApi(params),
    placeholderData: (prev) => prev,
  });

  return {
    affiliates: data?.affiliates || [],
    pagination: data?.pagination,
    isLoadingAffiliates,
    isErrorAffiliates,
  };
}
