'use client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createVehicleApi } from '@/services/apiVehicles';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';

export function useCreateVehicle() {
  const queryClient = useQueryClient();
  const router = useRouter();

  const { mutate: createVehicle, isPending: isCreatingVehicle } = useMutation({
    mutationFn: createVehicleApi,
    onSuccess: () => {
      toast.success('Vehicle created successfully');
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      router.push('/admin/vehicles');
    },
    onError: () => {
      toast.error('Vehicle could not be created');
    },
  });

  return { createVehicle, isCreatingVehicle };
}
