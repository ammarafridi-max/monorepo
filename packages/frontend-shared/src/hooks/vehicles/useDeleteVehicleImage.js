'use client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { deleteVehicleImageApi } from '../../services/apiVehicles.js';

export function useDeleteVehicleImage() {
  const queryClient = useQueryClient();

  const { mutate: deleteVehicleImage, isPending: isDeletingVehicleImage } = useMutation({
    mutationFn: ({ id, imageUrl }) => deleteVehicleImageApi(id, imageUrl),
    onSuccess: (_data, { id }) => {
      toast.success('Image deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      queryClient.invalidateQueries({ queryKey: ['vehicle', id] });
    },
    onError: (err) => {
      toast.error(err.message || 'Image could not be deleted');
    },
  });

  return { deleteVehicleImage, isDeletingVehicleImage };
}
