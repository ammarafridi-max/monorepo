'use client';
import { useMutation } from '@tanstack/react-query';
import { createCurrencyApi } from '@/services/apiCurrencies';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

export function useCreateCurrency() {
  const router = useRouter();
  const { mutate: createCurrency, isPending: isCreatingCurrency } = useMutation(
    {
      mutationFn: createCurrencyApi,
      onSuccess: () => {
        toast.success('Currency created successfully!');
        router.push('/admin/currencies');
      },
      onError: () => {
        toast.error('Currency could not be created');
      },
    }
  );

  return { createCurrency, isCreatingCurrency };
}
