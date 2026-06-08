'use client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { updateVehicleApi } from '../../services/apiVehicles.js';

export function useUpdateVehicle() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const { mutate: updateVehicle, isPending: isUpdatingVehicle } = useMutation({
    mutationFn: ({ id, formData }) => updateVehicleApi({ id, formData }),
    onSuccess: () => {
      toast.success('Vehicle updated successfully');
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      router.push('/admin/vehicles');
    },
    onError: (err) => {
      toast.error(err.message || 'Vehicle could not be updated');
    },
  });

  return { updateVehicle, isUpdatingVehicle };
}
