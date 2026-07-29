'use client';
import { useQuery } from '@tanstack/react-query';
import { adminListApplicationsApi, adminGetApplicationApi } from '../../services/apiVisaApplications.js';

export function useAdminApplications(filters = {}) {
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['admin-applications', filters],
    queryFn: () => adminListApplicationsApi(filters),
    placeholderData: (prev) => prev,
  });
  return {
    applications: data?.applications ?? [],
    summary: data?.summary ?? null,
    pagination: data?.pagination ?? null,
    isLoading,
    isError,
    error,
    refetch,
  };
}

export function useAdminApplication(id) {
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['admin-application', id],
    queryFn: () => adminGetApplicationApi(id),
    enabled: Boolean(id),
  });
  return { application: data?.application ?? null, isLoading, isError, error, refetch };
}
