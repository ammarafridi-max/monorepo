'use client';

import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { deleteVehicleApi } from '@/services/apiVehicles';
import toast from 'react-hot-toast';

export function useDeleteVehicle() {
  const router = useRouter();
  const { mutate: deleteVehicle, isPending: isDeletingVehicle } = useMutation({
    mutationFn: async (id) => {
      const confirmDelete = window.confirm(
        'Are you sure you want to delete this vehicle?'
      );
      if (!confirmDelete) throw new Error('Delete cancelled');
      return deleteVehicleApi(id);
    },
    onSuccess: () => {
      toast.success('Vehicle deleted successfully');
      router.push('/admin/vehicles');
    },
    onError: () => {
      toast.error('Vehicle could not be deleted');
    },
  });

  return { deleteVehicle, isDeletingVehicle };
}
