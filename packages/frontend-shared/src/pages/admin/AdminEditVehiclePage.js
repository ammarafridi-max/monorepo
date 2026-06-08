'use client';

import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Loader2, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import VehicleForm from '../../components/admin/v1/VehicleForm';
import { useGetVehicle } from '../../hooks/vehicles/useGetVehicle';
import { useUpdateVehicle } from '../../hooks/vehicles/useUpdateVehicle';

export default function AdminEditVehiclePage() {
  const { id } = useParams();
  const router = useRouter();

  const { vehicle, isLoadingVehicle, isErrorVehicle } = useGetVehicle(id);
  const { updateVehicle, isUpdatingVehicle } = useUpdateVehicle();

  function handleSubmit(formData) {
    updateVehicle(
      { id, formData },
      { onSuccess: () => router.push('/admin/vehicles') },
    );
  }

  if (isLoadingVehicle) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3 text-gray-400">
          <Loader2 size={28} className="animate-spin" />
          <p className="text-sm font-medium">Loading vehicle…</p>
        </div>
      </div>
    );
  }

  if (isErrorVehicle || !vehicle) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4 text-center max-w-xs">
          <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center">
            <AlertCircle size={24} className="text-red-400" />
          </div>
          <div>
            <p className="text-sm font-bold text-gray-700">Vehicle not found</p>
            <p className="text-xs text-gray-400 mt-1">
              This vehicle may have been deleted or the ID is incorrect.
            </p>
          </div>
          <Link
            href="/admin/vehicles"
            className="flex items-center gap-1.5 text-xs font-semibold text-primary-700 hover:underline"
          >
            <ArrowLeft size={13} /> Back to vehicles
          </Link>
        </div>
      </div>
    );
  }

  return (
    <VehicleForm
      initialData={vehicle}
      onSubmit={handleSubmit}
      isPending={isUpdatingVehicle}
    />
  );
}
