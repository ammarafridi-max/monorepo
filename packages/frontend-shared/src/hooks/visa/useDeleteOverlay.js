'use client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deleteOverlayApi } from '../../services/apiVisa.js';
import toast from 'react-hot-toast';

export function useDeleteOverlay() {
  const queryClient = useQueryClient();

  const { mutate: deleteOverlay, isPending: isDeletingOverlay } = useMutation({
    mutationFn: ({ residence, visaSlug }) => deleteOverlayApi({ residence, visaSlug }),
    onSuccess: (_, { visaSlug, residenceName, residence }) => {
      toast.success(`${residenceName || residence} version removed`);
      queryClient.invalidateQueries({ queryKey: ['visa-overlays', visaSlug] });
    },
    onError: (err) => toast.error(`Could not remove: ${err.message}`),
  });

  return { deleteOverlay, isDeletingOverlay };
}
