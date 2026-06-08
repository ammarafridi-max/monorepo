'use client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { duplicateVehicleApi } from '../../services/apiVehicles.js';

export function useDuplicateVehicle() {
  const queryClient = useQueryClient();

  const { mutate: duplicateVehicle, isPending: isDuplicatingVehicle } = useMutation({
    mutationFn: (id) => duplicateVehicleApi(id),
    onSuccess: () => {
      toast.success('Vehicle duplicated successfully');
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
    },
    onError: (err) => {
      toast.error(err.message || 'Vehicle could not be duplicated');
    },
  });

  return { duplicateVehicle, isDuplicatingVehicle };
}
