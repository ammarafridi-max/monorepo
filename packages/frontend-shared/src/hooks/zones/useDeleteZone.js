'use client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { deleteZoneApi } from '../../services/apiZones.js';

export function useDeleteZone() {
  const queryClient = useQueryClient();

  const { mutate: deleteZone, isPending: isDeletingZone } = useMutation({
    mutationFn: (id) => deleteZoneApi(id),
    onSuccess: () => {
      toast.success('Zone deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['zones'] });
    },
    onError: (err) => {
      toast.error(err.message || 'Zone could not be deleted');
    },
  });

  return { deleteZone, isDeletingZone };
}
