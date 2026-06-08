'use client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { duplicateZoneApi } from '../../services/apiZones.js';

export function useDuplicateZone() {
  const queryClient = useQueryClient();

  const { mutate: duplicateZone, isPending: isDuplicatingZone } = useMutation({
    mutationFn: (id) => duplicateZoneApi(id),
    onSuccess: () => {
      toast.success('Zone duplicated successfully');
      queryClient.invalidateQueries({ queryKey: ['zones'] });
    },
    onError: (err) => {
      toast.error(err.message || 'Zone could not be duplicated');
    },
  });

  return { duplicateZone, isDuplicatingZone };
}
