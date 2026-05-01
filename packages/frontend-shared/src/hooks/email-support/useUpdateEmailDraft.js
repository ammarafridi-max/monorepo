'use client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { updateDraftApi } from '../../services/apiEmailSupport.js';

export function useUpdateEmailDraft() {
  const queryClient = useQueryClient();

  const { mutate: updateDraft, isPending: isUpdatingDraft } = useMutation({
    mutationFn: ({ id, draft }) => updateDraftApi(id, draft),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-support'] });
    },
    onError: (err) => {
      toast.error(err.message || 'Failed to save draft');
    },
  });

  return { updateDraft, isUpdatingDraft };
}
