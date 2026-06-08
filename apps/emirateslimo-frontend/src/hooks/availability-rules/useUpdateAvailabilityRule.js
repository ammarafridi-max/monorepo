'use client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateAvailabilityRuleApi } from '@/services/apiAvailabilityRules';
import toast from 'react-hot-toast';

export function useUpdateAvailabilityRule() {
  const queryClient = useQueryClient();

  const {
    mutate: updateAvailabilityRule,
    isPending: isUpdatingAvailabilityRule,
  } = useMutation({
    mutationFn: updateAvailabilityRuleApi,
    onSuccess: (data) => {
      toast.success('Availability rule updated successfully');
      queryClient.invalidateQueries({ queryKey: ['availability-rules'] });
      queryClient.invalidateQueries({
        queryKey: ['availability-rule', data._id],
      });
    },
    onError: () => {
      toast.error('Availability rule could not be updated');
    },
  });

  return { updateAvailabilityRule, isUpdatingAvailabilityRule };
}
