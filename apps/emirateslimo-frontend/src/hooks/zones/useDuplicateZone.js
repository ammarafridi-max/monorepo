'use client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { duplicateZoneApi } from '@/services/apiZones';
import toast from 'react-hot-toast';

export function useDuplicateZone() {
  const queryClient = useQueryClient();

  const { mutate: duplicateZone, isPending: isDuplicating } = useMutation({
    mutationFn: duplicateZoneApi,
    onSuccess: (newZone) => {
      toast.success(`Zone "${newZone.name}" duplicated successfully`);
      queryClient.invalidateQueries({ queryKey: ['zones'] });
    },
    onError: (err) => {
      toast.error(err.message || 'Failed to duplicate zone');
    },
  });

  return { duplicateZone, isDuplicating };
}
