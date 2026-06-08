'use client';
import { useMutation } from '@tanstack/react-query';
import { updateCurrencyApi } from '@/services/apiCurrencies';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

export function useUpdateCurrency() {
  const router = useRouter();
  const { mutate: updateCurrency, isPending: isUpdatingCurrency } = useMutation({
    mutationFn: ({ id, currencyData }) => updateCurrencyApi(id, currencyData),
    onSuccess: () => {
      toast.success('Currency updated successfully');
      router.push('/admin/currencies');
    },
    onError: (err) => {
      toast.error(err.message || 'Currency could not be updated');
    },
  });

  return { updateCurrency, isUpdatingCurrency };
}
