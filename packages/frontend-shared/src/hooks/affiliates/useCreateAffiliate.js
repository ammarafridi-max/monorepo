'use client';
import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { createAffiliateApi } from '../../services/apiAffiliates.js';

export function useCreateAffiliate() {
  const router = useRouter();

  const { mutate: createAffiliate, isPending: isCreatingAffiliate } = useMutation({
    mutationFn: createAffiliateApi,
    onSuccess: () => {
      toast.success('Affiliate created successfully');
      router.push('/admin/affiliates');
    },
    onError: (error) => {
      toast.error(error.message || 'Affiliate could not be created');
    },
  });

  return { createAffiliate, isCreatingAffiliate };
}
