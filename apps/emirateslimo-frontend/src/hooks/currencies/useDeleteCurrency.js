'use client';
import { useMutation } from '@tanstack/react-query';
import { deleteCurrencyApi } from '@/services/apiCurrencies';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

export function useDeleteCurrency() {
  const router = useRouter();
  const { mutate: deleteCurrency, isPending: isDeletingCurrency } = useMutation({
    mutationFn: (code) => deleteCurrencyApi(code),
    onSuccess: () => {
      toast.success('Currency deleted successfully!');
      router.push('/admin/currencies');
    },
    onError: (err) => {
      toast.error(err.message || 'Currency could not be deleted');
    },
  });

  return { deleteCurrency, isDeletingCurrency };
}
