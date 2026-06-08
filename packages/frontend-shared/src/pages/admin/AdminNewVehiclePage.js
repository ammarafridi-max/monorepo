'use client';

import { useRouter } from 'next/navigation';
import VehicleForm from '../../components/admin/v1/VehicleForm';
import { useCreateVehicle } from '../../hooks/vehicles/useCreateVehicle';

export default function AdminNewVehiclePage() {
  const router = useRouter();
  const { createVehicle, isCreatingVehicle } = useCreateVehicle();

  function handleSubmit(formData) {
    createVehicle(formData, {
      onSuccess: () => router.push('/admin/vehicles'),
    });
  }

  return <VehicleForm onSubmit={handleSubmit} isPending={isCreatingVehicle} />;
}
