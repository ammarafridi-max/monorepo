'use client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deleteZoneApi } from '@/services/apiZones';
import { toast } from 'react-hot-toast';
import { useRouter } from 'next/navigation';

export function useDeleteZone() {
  const queryClient = useQueryClient();
  const router = useRouter();

  const { mutate: deleteZone, isPending: isDeleting } = useMutation({
    mutationFn: async (id) => {
      const confirmDelete = window.confirm(
        'Are you sure you want to delete this zone?'
      );
      if (!confirmDelete) return null;
      return deleteZoneApi(id);
    },
    onSuccess: (res) => {
      if (!res) return;
      toast.success('Zone deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['zones'] });
      router.push('/admin/zones');
    },
    onError: (err) => {
      toast.error(err.message || 'Failed to delete zone');
    },
  });

  return { deleteZone, isDeleting };
}
