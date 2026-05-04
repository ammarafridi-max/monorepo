'use client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { unpublishVisaApi } from '../../services/apiVisa.js';
import toast from 'react-hot-toast';

export function useUnpublishVisa() {
  const queryClient = useQueryClient();

  const { mutate: unpublishVisa, isPending: isUnpublishingVisa } = useMutation({
    mutationFn: (id) => unpublishVisaApi(id),
    onSuccess: (_, id) => {
      toast.success('Visa unpublished');
      queryClient.invalidateQueries({ queryKey: ['visas'] });
      queryClient.invalidateQueries({ queryKey: ['visas', 'admin', id] });
    },
    onError: (err) => {
      toast.error(`Could not unpublish visa: ${err.message}`);
    },
  });

  return { unpublishVisa, isUnpublishingVisa };
}
