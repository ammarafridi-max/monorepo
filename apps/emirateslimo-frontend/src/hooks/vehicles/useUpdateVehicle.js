'use client';

import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { updateVehicleApi } from '@/services/apiVehicles';
import toast from 'react-hot-toast';

export function useUpdateVehicle() {
  const router = useRouter();
  const { mutate: updateVehicle, isPending: isUpdatingVehicle } = useMutation({
    mutationFn: updateVehicleApi,
    onSuccess: () => {
      toast.success('Vehicle updated successfully');
      router.push('/admin/vehicles');
    },
    onError: () => {
      toast.error('Vehicle could not be updated');
    },
  });

  return { updateVehicle, isUpdatingVehicle };
}
