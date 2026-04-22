'use client';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'next/navigation';
import { getInsuranceApplicationsApi } from '../../services/apiInsurance.js';

export function useGetInsuranceApplications() {
  const searchParams = useSearchParams();
  const params = Object.fromEntries([...searchParams]);

  const {
    data,
    isLoading: isLoadingApplications,
    isError: isErrorApplications,
  } = useQuery({
    queryKey: ['insuranceApplications', params],
    queryFn: () => getInsuranceApplicationsApi(params),
    refetchOnMount: 'always',
    placeholderData: (prev) => prev,
  });

  return {
    applications: data?.data,
    pagination: data?.pagination,
    isLoadingApplications,
    isErrorApplications,
  };
}
