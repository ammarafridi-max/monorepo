'use client';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'next/navigation';
import { getAffiliatesApi } from '../../services/apiAffiliates.js';

export function useGetAffiliates(overrides) {
  const searchParams = useSearchParams();
  const params = overrides ?? Object.fromEntries([...searchParams]);

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
