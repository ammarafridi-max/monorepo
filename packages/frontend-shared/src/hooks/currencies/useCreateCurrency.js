'use client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { createCurrencyApi } from '../../services/apiCurrencies.js';

export function useCreateCurrency() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const { mutate: createCurrency, isPending: isCreatingCurrency } = useMutation({
    mutationFn: createCurrencyApi,
    onSuccess: () => {
      toast.success('Currency created successfully');
      queryClient.invalidateQueries({ queryKey: ['currencies'] });
      router.push('/admin/currencies');
    },
    onError: (err) => {
      toast.error(err.message || 'Currency could not be created');
    },
  });

  return { createCurrency, isCreatingCurrency };
}
