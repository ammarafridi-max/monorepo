'use client';
import { useQuery } from '@tanstack/react-query';
import { getPublicVisasApi } from '../../services/apiVisa.js';

export function useGetPublicVisas() {
  const { data, isLoading: isLoadingVisas, isError: isErrorVisas } = useQuery({
    queryKey: ['visas', 'public'],
    queryFn: () => getPublicVisasApi(),
  });

  const visas = Array.isArray(data) ? data : (data?.visas ?? []);

  return { visas, isLoadingVisas, isErrorVisas };
}
