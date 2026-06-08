'use client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createZoneApi } from '@/services/apiZones';
import { toast } from 'react-hot-toast';
import { useRouter } from 'next/navigation';

export function useCreateZone() {
  const queryClient = useQueryClient();
  const router = useRouter();

  const { mutate: createZone, isPending: isCreating } = useMutation({
    mutationFn: createZoneApi,
    onSuccess: (newZone) => {
      toast.success(`Zone "${newZone.name}" created successfully`);
      queryClient.invalidateQueries({ queryKey: ['zones'] }); // refresh zones list
      router.push('/admin/zones');
    },
    onError: (err) => {
      toast.error(err.message || 'Failed to create zone');
    },
  });

  return { createZone, isCreating };
}
