'use client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { deleteAvailabilityRuleApi } from '../../services/apiAvailabilityRules.js';

export function useDeleteAvailabilityRule() {
  const queryClient = useQueryClient();

  const {
    mutate: deleteAvailabilityRule,
    isPending: isDeletingAvailabilityRule,
  } = useMutation({
    mutationFn: (id) => deleteAvailabilityRuleApi(id),
    onSuccess: () => {
      toast.success('Availability rule deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['availability-rules'] });
    },
    onError: (err) => {
      toast.error(err.message || 'Availability rule could not be deleted');
    },
  });

  return { deleteAvailabilityRule, isDeletingAvailabilityRule };
}
