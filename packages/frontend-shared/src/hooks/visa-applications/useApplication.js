'use client';
import { useQuery } from '@tanstack/react-query';
import { getApplicationByRefApi } from '../../services/apiVisaApplications.js';

export function useApplication(applicationRef) {
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['application', applicationRef],
    queryFn: () => getApplicationByRefApi(applicationRef),
    enabled: Boolean(applicationRef),
  });
  return { application: data?.application ?? null, isLoading, isError, error, refetch };
}
