'use client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { duplicateVisaApi } from '../../services/apiVisa.js';
import toast from 'react-hot-toast';

export function useDuplicateVisa() {
  const queryClient = useQueryClient();

  const { mutate: duplicateVisa, isPending: isDuplicatingVisa } = useMutation({
    mutationFn: (id) => duplicateVisaApi(id),
    onSuccess: () => {
      toast.success('Visa duplicated successfully');
      queryClient.invalidateQueries({ queryKey: ['visas'] });
    },
    onError: (err) => {
      toast.error(`Visa could not be duplicated: ${err.message}`);
    },
  });

  return { duplicateVisa, isDuplicatingVisa };
}
