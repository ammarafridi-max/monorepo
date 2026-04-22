'use client';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { getAffiliateApi } from '../../services/apiAffiliates.js';

export function useGetAffiliate(id) {
  const router = useRouter();

  const {
    data: affiliate,
    isLoading: isLoadingAffiliate,
    isError: isErrorAffiliate,
  } = useQuery({
    queryKey: ['affiliate', id],
    queryFn: () => getAffiliateApi(id),
    enabled: Boolean(id),
    onError: (error) => {
      toast.error(error.message || 'Could not fetch affiliate');
      router.push('/admin/affiliates');
    },
  });

  return {
    affiliate,
    isLoadingAffiliate,
    isErrorAffiliate,
  };
}
