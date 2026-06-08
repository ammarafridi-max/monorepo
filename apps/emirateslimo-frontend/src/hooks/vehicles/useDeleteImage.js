'use client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deleteVehicleImageApi } from '@/services/apiVehicles';
import { toast } from 'react-hot-toast';

export function useDeleteImage() {
  const queryClient = useQueryClient();
  const { mutate: deleteImage, isPending: isDeleting } = useMutation({
    mutationFn: ({ id, imageUrl }) => deleteVehicleImageApi(id, imageUrl),
    onSuccess: () => {
      toast.success('Image deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
    },
    onError: () => {
      toast.error('Image could not be deleted');
    },
  });

  return { deleteImage, isDeleting };
}
