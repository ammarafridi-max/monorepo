'use client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { duplicateAvailabilityRuleApi } from '../../services/apiAvailabilityRules.js';

export function useDuplicateAvailabilityRule() {
  const queryClient = useQueryClient();

  const {
    mutate: duplicateAvailabilityRule,
    isPending: isDuplicatingAvailabilityRule,
  } = useMutation({
    mutationFn: (id) => duplicateAvailabilityRuleApi(id),
    onSuccess: () => {
      toast.success('Availability rule duplicated successfully');
      queryClient.invalidateQueries({ queryKey: ['availability-rules'] });
    },
    onError: (err) => {
      toast.error(err.message || 'Availability rule could not be duplicated');
    },
  });

  return { duplicateAvailabilityRule, isDuplicatingAvailabilityRule };
}
