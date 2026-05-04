'use client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { publishVisaApi } from '../../services/apiVisa.js';
import toast from 'react-hot-toast';

export function usePublishVisa() {
  const queryClient = useQueryClient();

  const { mutate: publishVisa, isPending: isPublishingVisa } = useMutation({
    mutationFn: (id) => publishVisaApi(id),
    onSuccess: (_, id) => {
      toast.success('Visa published successfully');
      queryClient.invalidateQueries({ queryKey: ['visas'] });
      queryClient.invalidateQueries({ queryKey: ['visas', 'admin', id] });
    },
    onError: (err) => {
      toast.error(`Could not publish visa: ${err.message}`);
    },
  });

  return { publishVisa, isPublishingVisa };
}
