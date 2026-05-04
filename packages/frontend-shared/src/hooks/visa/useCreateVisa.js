'use client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createVisaApi } from '../../services/apiVisa.js';
import toast from 'react-hot-toast';

export function useCreateVisa() {
  const queryClient = useQueryClient();

  const { mutate: createVisa, isPending: isCreatingVisa } = useMutation({
    mutationFn: ({ data, file }) => createVisaApi({ data, file }),
    onSuccess: () => {
      toast.success('Visa created successfully');
      queryClient.invalidateQueries({ queryKey: ['visas'] });
    },
    onError: (err) => {
      toast.error(`Visa could not be created: ${err.message}`);
    },
  });

  return { createVisa, isCreatingVisa };
}
