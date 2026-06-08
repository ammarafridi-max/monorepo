'use client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { updateAvailabilityRuleApi } from '../../services/apiAvailabilityRules.js';

export function useUpdateAvailabilityRule() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const {
    mutate: updateAvailabilityRule,
    isPending: isUpdatingAvailabilityRule,
  } = useMutation({
    mutationFn: ({ id, data }) => updateAvailabilityRuleApi(id, data),
    onSuccess: (_, variables) => {
      toast.success('Availability rule updated successfully');
      queryClient.invalidateQueries({ queryKey: ['availability-rules'] });
      queryClient.invalidateQueries({
        queryKey: ['availability-rule', variables.id],
      });
      router.push('/admin/availability-rules');
    },
    onError: (err) => {
      toast.error(err.message || 'Availability rule could not be updated');
    },
  });

  return { updateAvailabilityRule, isUpdatingAvailabilityRule };
}
