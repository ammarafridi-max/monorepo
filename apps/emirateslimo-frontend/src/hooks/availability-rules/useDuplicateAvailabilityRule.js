'use client';

// useDuplicateAvailabilityRule.js
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { duplicateAvailabilityRuleApi } from '@/services/apiAvailabilityRules';
import toast from 'react-hot-toast';

export function useDuplicateAvailabilityRule() {
  const queryClient = useQueryClient();

  const {
    mutate: duplicateAvailabilityRule,
    isPending: isDuplicatingAvailabilityRule,
  } = useMutation({
    mutationFn: duplicateAvailabilityRuleApi,
    onSuccess: (data) => {
      toast.success(`Rule "${data?.name}" duplicated successfully`);
      queryClient.invalidateQueries({ queryKey: ['availability-rules'] });
    },

    onError: () => {
      toast.error('Availability rule could not be duplicated');
    },
  });

  return { duplicateAvailabilityRule, isDuplicatingAvailabilityRule };
}
