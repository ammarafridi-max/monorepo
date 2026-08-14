'use client';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'next/navigation';
import { getInsuranceApplicationsSummaryApi } from '../../services/apiInsurance.js';

export function useGetInsuranceApplicationsSummary() {
  const searchParams = useSearchParams();
  const params = Object.fromEntries([...searchParams]);
  delete params.page;
  delete params.limit;

  const { data: summary, isLoading: isLoadingSummary, error } = useQuery({
    queryKey: ['insuranceApplicationsSummary', params],
    queryFn: () => getInsuranceApplicationsSummaryApi(params),
    placeholderData: (prev) => prev,
  });

  return {
    summary,
    isLoadingSummary,
    error,
  };
}
