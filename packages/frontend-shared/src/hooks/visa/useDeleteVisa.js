'use client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deleteVisaApi } from '../../services/apiVisa.js';
import toast from 'react-hot-toast';

export function useDeleteVisa() {
  const queryClient = useQueryClient();

  const { mutate: deleteVisa, isPending: isDeletingVisa } = useMutation({
    mutationFn: (id) => deleteVisaApi(id),
    onSuccess: () => {
      toast.success('Visa deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['visas'] });
    },
    onError: (err) => {
      toast.error(`Visa could not be deleted: ${err.message}`);
    },
  });

  return { deleteVisa, isDeletingVisa };
}
