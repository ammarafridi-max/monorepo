'use client';
import { useQuery } from '@tanstack/react-query';
import { getAdminVisasApi } from '../../services/apiVisa.js';

export function useGetAdminVisas({ page = 1, limit = 20, status, search } = {}) {
  const { data, isLoading: isLoadingVisas, isError: isErrorVisas } = useQuery({
    queryKey: ['visas', 'admin', page, limit, status, search],
    queryFn: () => getAdminVisasApi({ page, limit, status, search }),
  });

  const visas = data?.visas ?? [];
  const pagination = data?.pagination ?? null;

  return { visas, pagination, isLoadingVisas, isErrorVisas };
}
