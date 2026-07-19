'use client';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'next/navigation';
import { getInsuranceApplicationsSummaryApi } from '../../services/apiInsurance.js';

export function useGetInsuranceApplicationsSummary() {
  const searchParams = useSearchParams();
  // Mirror the filters that drive the table (search, paymentStatus,
  // journeyType, createdAt) so the stats cards recompute over exactly the
  // rows the table shows. Pagination keys don't affect the summary.
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
