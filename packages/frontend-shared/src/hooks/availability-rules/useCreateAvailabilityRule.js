'use client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { createAvailabilityRuleApi } from '../../services/apiAvailabilityRules.js';

export function useCreateAvailabilityRule() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const {
    mutate: createAvailabilityRule,
    isPending: isCreatingAvailabilityRule,
  } = useMutation({
    mutationFn: createAvailabilityRuleApi,
    onSuccess: () => {
      toast.success('Availability rule created successfully');
      queryClient.invalidateQueries({ queryKey: ['availability-rules'] });
      router.push('/admin/availability-rules');
    },
    onError: (err) => {
      toast.error(err.message || 'Availability rule could not be created');
    },
  });

  return { createAvailabilityRule, isCreatingAvailabilityRule };
}
