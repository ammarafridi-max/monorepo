'use client';
import { useQuery } from '@tanstack/react-query';
import { getVisaByIdApi } from '../../services/apiVisa.js';

export function useGetVisa(id) {
  const { data, isLoading: isLoadingVisa, isError: isErrorVisa } = useQuery({
    queryKey: ['visas', 'admin', id],
    queryFn: () => getVisaByIdApi(id),
    enabled: !!id,
  });

  return { visa: data ?? null, isLoadingVisa, isErrorVisa };
}
