'use client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateZoneApi } from '@/services/apiZones';
import { toast } from 'react-hot-toast';
import { useRouter } from 'next/navigation';

export function useUpdateZone() {
  const queryClient = useQueryClient();
  const router = useRouter();

  const { mutate: updateZone, isPending: isUpdating } = useMutation({
    mutationFn: ({ id, zoneData }) => updateZoneApi(id, zoneData),
    onSuccess: (updatedZone) => {
      toast.success(`Zone "${updatedZone.name}" updated successfully`);
      queryClient.invalidateQueries({ queryKey: ['zones'] });
      router.push('/admin/zones');
    },

    onError: (err) => {
      toast.error(err.message || 'Failed to update zone');
    },
  });

  return { updateZone, isUpdating };
}
