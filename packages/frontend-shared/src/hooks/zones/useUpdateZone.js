'use client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { updateZoneApi } from '../../services/apiZones.js';

export function useUpdateZone() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const { mutate: updateZone, isPending: isUpdatingZone } = useMutation({
    mutationFn: ({ id, zoneData }) => updateZoneApi(id, zoneData),
    onSuccess: (_, variables) => {
      toast.success('Zone updated successfully');
      queryClient.invalidateQueries({ queryKey: ['zones'] });
      queryClient.invalidateQueries({ queryKey: ['zone', variables.id] });
      router.push('/admin/zones');
    },
    onError: (err) => {
      toast.error(err.message || 'Zone could not be updated');
    },
  });

  return { updateZone, isUpdatingZone };
}
