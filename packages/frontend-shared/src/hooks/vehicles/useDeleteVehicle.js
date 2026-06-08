'use client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { deleteVehicleApi } from '../../services/apiVehicles.js';

export function useDeleteVehicle() {
  const queryClient = useQueryClient();

  const { mutate: deleteVehicle, isPending: isDeletingVehicle } = useMutation({
    mutationFn: (id) => deleteVehicleApi(id),
    onSuccess: () => {
      toast.success('Vehicle deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
    },
    onError: (err) => {
      toast.error(err.message || 'Vehicle could not be deleted');
    },
  });

  return { deleteVehicle, isDeletingVehicle };
}
