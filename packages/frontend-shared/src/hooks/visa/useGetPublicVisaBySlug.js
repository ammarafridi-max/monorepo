'use client';
import { useQuery } from '@tanstack/react-query';
import { getPublicVisaBySlugApi } from '../../services/apiVisa.js';

export function useGetPublicVisaBySlug(slug) {
  const { data, isLoading: isLoadingVisa, isError: isErrorVisa } = useQuery({
    queryKey: ['visas', 'public', slug],
    queryFn: () => getPublicVisaBySlugApi(slug),
    enabled: !!slug,
  });

  return { visa: data ?? null, isLoadingVisa, isErrorVisa };
}
