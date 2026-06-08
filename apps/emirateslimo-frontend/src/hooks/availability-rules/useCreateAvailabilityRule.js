'use client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createAvailabilityRuleApi } from '@/services/apiAvailabilityRules';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';

export function useCreateAvailabilityRule() {
  const queryClient = useQueryClient();
  const router = useRouter();

  const {
    mutate: createAvailabilityRule,
    isPending: isCreatingAvailabilityRule,
  } = useMutation({
    mutationFn: createAvailabilityRuleApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['availability-rules'] });
      toast.success('Availability rule created successfully');
      router.push('/admin/availability-rules');
    },
    onError: () => {
      toast.error('Availability rule could not be created');
    },
  });

  return { createAvailabilityRule, isCreatingAvailabilityRule };
}
