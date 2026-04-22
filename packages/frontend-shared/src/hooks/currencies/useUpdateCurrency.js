'use client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { updateCurrencyApi } from '../../services/apiCurrencies.js';

export function useUpdateCurrency() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const { mutate: updateCurrency, isPending: isUpdatingCurrency } = useMutation({
    mutationFn: ({ code, currencyData }) => updateCurrencyApi(code, currencyData),
    onSuccess: (_, variables) => {
      toast.success('Currency updated successfully');
      queryClient.invalidateQueries({ queryKey: ['currencies'] });
      queryClient.invalidateQueries({ queryKey: ['currency', variables.code] });
      router.push('/admin/currencies');
    },
    onError: (err) => {
      toast.error(err.message || 'Currency could not be updated');
    },
  });

  return { updateCurrency, isUpdatingCurrency };
}
