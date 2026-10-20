'use client';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { decideAssistantActionApi } from '../../services/apiAssistant.js';

export function useAssistantAction({ onDecided } = {}) {
  const { mutate, isPending, variables } = useMutation({
    mutationFn: decideAssistantActionApi,
    onSuccess: (data, input) => {
      const action = data?.action;
      toast.success(input.approve ? 'Done. ' + (action?.summary ?? '') : 'Cancelled.');
      onDecided?.({ ...action, approved: input.approve });
    },
    onError: (error, input) => {
      toast.error(error.message);
      onDecided?.({ id: input.id, status: 'failed', error: error.message });
    },
  });

  return {
    decideAction: mutate,
    decidingAction: isPending,
    decidingId: isPending ? variables?.id : null,
  };
}
