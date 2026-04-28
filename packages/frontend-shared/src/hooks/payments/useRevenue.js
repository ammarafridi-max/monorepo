'use client';
import { useQuery } from '@tanstack/react-query';
import { getRevenueApi } from '../../services/apiPayments.js';

export function useRevenue({ from, to }) {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['admin-revenue', from, to],
    queryFn: () => getRevenueApi({ from, to }),
    enabled: Boolean(from && to),
  });
  return {
    revenue: data,
    isLoadingRevenue: isLoading,
    isErrorRevenue: isError,
    revenueError: error,
  };
}
