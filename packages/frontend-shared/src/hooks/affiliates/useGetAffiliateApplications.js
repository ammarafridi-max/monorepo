'use client';
import { useQuery } from '@tanstack/react-query';
import { getAffiliateApplicationsApi } from '../../services/apiAffiliates.js';

export function useGetAffiliateApplications(id, params = {}) {
  const {
    data,
    isLoading: isLoadingAffiliateApplications,
    isError: isErrorAffiliateApplications,
  } = useQuery({
    queryKey: ['affiliate-applications', id, params],
    queryFn: () => getAffiliateApplicationsApi(id, params),
    enabled: Boolean(id),
    placeholderData: (prev) => prev,
  });

  return {
    applications: data?.applications || [],
    pagination: data?.pagination,
    isLoadingAffiliateApplications,
    isErrorAffiliateApplications,
  };
}
