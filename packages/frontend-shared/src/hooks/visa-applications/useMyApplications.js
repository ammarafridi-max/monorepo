'use client';
import { useQuery } from '@tanstack/react-query';
import { getMyApplicationsApi } from '../../services/apiVisaApplications.js';

export function useMyApplications() {
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['my-applications'],
    queryFn: getMyApplicationsApi,
  });
  return { applications: data?.applications ?? [], isLoading, isError, error, refetch };
}
