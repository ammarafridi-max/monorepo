'use client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { deleteCurrencyApi } from '../../services/apiCurrencies.js';

export function useDeleteCurrency() {
  const queryClient = useQueryClient();

  const { mutate: deleteCurrency, isPending: isDeletingCurrency } = useMutation({
    mutationFn: (code) => deleteCurrencyApi(code),
    onSuccess: () => {
      toast.success('Currency deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['currencies'] });
    },
    onError: (err) => {
      toast.error(err.message || 'Currency could not be deleted');
    },
  });

  return { deleteCurrency, isDeletingCurrency };
}
