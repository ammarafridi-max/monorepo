'use client';
import { useQuery } from '@tanstack/react-query';
import { getInsuranceApplicationsSummaryApi } from '../../services/apiInsurance.js';

export function useGetInsuranceApplicationsSummary() {
  const { data: summary, isLoading: isLoadingSummary, error } = useQuery({
    queryKey: ['insuranceApplicationsSummary'],
    queryFn: getInsuranceApplicationsSummaryApi,
  });

  return {
    summary,
    isLoadingSummary,
    error,
  };
}
