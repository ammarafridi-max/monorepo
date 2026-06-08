'use client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { createVehicleApi } from '../../services/apiVehicles.js';

export function useCreateVehicle() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const { mutate: createVehicle, isPending: isCreatingVehicle } = useMutation({
    mutationFn: createVehicleApi,
    onSuccess: () => {
      toast.success('Vehicle created successfully');
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      router.push('/admin/vehicles');
    },
    onError: (err) => {
      toast.error(err.message || 'Vehicle could not be created');
    },
  });

  return { createVehicle, isCreatingVehicle };
}
