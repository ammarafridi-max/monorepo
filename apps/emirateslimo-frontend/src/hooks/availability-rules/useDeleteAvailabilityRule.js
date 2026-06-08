'use client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deleteAvailabilityRuleApi } from '@/services/apiAvailabilityRules';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

export function useDeleteAvailabilityRule() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const {
    mutate: deleteAvailabilityRule,
    isPending: isDeletingAvailabilityRule,
  } = useMutation({
    mutationFn: deleteAvailabilityRuleApi,
    onSuccess: () => {
      toast.success('Availability rule deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['availability-rules'] });
      router.push('/admin/availability-rules');
    },
    onError: () => {
      toast.error('Availability rule could not be deleted');
    },
  });

  function confirmAndDelete(id) {
    const confirmDelete = window.confirm(
      'Are you sure you want to delete this availability rule?'
    );
    if (confirmDelete) deleteAvailabilityRule(id);
  }

  return {
    deleteAvailabilityRule: confirmAndDelete,
    isDeletingAvailabilityRule,
  };
}
