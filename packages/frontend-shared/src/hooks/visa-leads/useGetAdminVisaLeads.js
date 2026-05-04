'use client';
import { useQuery } from '@tanstack/react-query';
import { getAdminVisaLeadsApi } from '../../services/apiVisaLeads.js';

export function useGetAdminVisaLeads(filters = {}) {
  const { page = 1, limit = 20, status, visaSlug, nationality, assignedTo, dateFrom, dateTo, search } = filters;

  const { data, isLoading: isLoadingLeads, isError: isErrorLeads, refetch } = useQuery({
    queryKey: ['visa-leads', 'admin', { page, limit, status, visaSlug, nationality, assignedTo, dateFrom, dateTo, search }],
    queryFn: () => getAdminVisaLeadsApi({ page, limit, status, visaSlug, nationality, assignedTo, dateFrom, dateTo, search }),
    refetchInterval: 30_000,
  });

  const leads = data?.leads ?? [];
  const pagination = data?.pagination ?? null;

  return { leads, pagination, isLoadingLeads, isErrorLeads, refetch };
}
