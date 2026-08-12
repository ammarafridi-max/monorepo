'use client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { upsertOverlayApi } from '../../services/apiVisa.js';
import toast from 'react-hot-toast';

export function useUpsertOverlay() {
  const queryClient = useQueryClient();

  const { mutate: upsertOverlay, isPending: isSavingOverlay } = useMutation({
    mutationFn: (payload) => upsertOverlayApi(payload),
    onSuccess: (_, payload) => {
      toast.success(`${payload.residenceName || payload.residence} version saved`);
      queryClient.invalidateQueries({ queryKey: ['visa-overlays', payload.visaSlug] });
    },
    onError: (err) => toast.error(`Could not save: ${err.message}`),
  });

  return { upsertOverlay, isSavingOverlay };
}
