'use client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateVisaApi } from '../../services/apiVisa.js';
import toast from 'react-hot-toast';

export function useUpdateVisa() {
  const queryClient = useQueryClient();

  const { mutate: updateVisa, isPending: isUpdatingVisa } = useMutation({
    mutationFn: ({ id, data, file }) => updateVisaApi({ id, data, file }),
    onSuccess: (_, { id }) => {
      toast.success('Visa updated successfully');
      queryClient.invalidateQueries({ queryKey: ['visas'] });
      queryClient.invalidateQueries({ queryKey: ['visas', 'admin', id] });
    },
    onError: (err) => {
      toast.error(`Visa could not be updated: ${err.message}`);
    },
  });

  return { updateVisa, isUpdatingVisa };
}
