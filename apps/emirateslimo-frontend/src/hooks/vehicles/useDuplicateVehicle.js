'use client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { duplicateVehicleApi } from '@/services/apiVehicles';
import toast from 'react-hot-toast';

export function useDuplicateVehicle() {
  const queryClient = useQueryClient();

  const { mutate: duplicateVehicle, isPending: isDuplicatingVehicle } =
    useMutation({
      mutationFn: duplicateVehicleApi,
      onSuccess: () => {
        toast.success('Vehicle duplicated successfully');
        queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      },
      onError: () => {
        toast.error('Vehicle could not be duplicated');
      },
    });

  return { duplicateVehicle, isDuplicatingVehicle };
}
