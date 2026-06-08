'use client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { createZoneApi } from '../../services/apiZones.js';

export function useCreateZone() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const { mutate: createZone, isPending: isCreatingZone } = useMutation({
    mutationFn: createZoneApi,
    onSuccess: () => {
      toast.success('Zone created successfully');
      queryClient.invalidateQueries({ queryKey: ['zones'] });
      router.push('/admin/zones');
    },
    onError: (err) => {
      toast.error(err.message || 'Zone could not be created');
    },
  });

  return { createZone, isCreatingZone };
}
