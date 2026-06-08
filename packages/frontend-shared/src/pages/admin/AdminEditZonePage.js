'use client';

import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Loader2, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import ZoneForm from '../../components/admin/v1/ZoneForm';
import { useGetZone } from '../../hooks/zones/useGetZone';
import { useUpdateZone } from '../../hooks/zones/useUpdateZone';

export default function AdminEditZonePage() {
  const { id } = useParams();
  const router = useRouter();

  const { zone, isLoadingZone, isErrorZone } = useGetZone(id);
  const { updateZone, isUpdatingZone } = useUpdateZone();

  function handleSubmit(zoneData) {
    updateZone(
      { id, zoneData },
      { onSuccess: () => router.push('/admin/zones') },
    );
  }

  if (isLoadingZone) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3 text-gray-400">
          <Loader2 size={28} className="animate-spin" />
          <p className="text-sm font-medium">Loading zone…</p>
        </div>
      </div>
    );
  }

  if (isErrorZone || !zone) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4 text-center max-w-xs">
          <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center">
            <AlertCircle size={24} className="text-red-400" />
          </div>
          <div>
            <p className="text-sm font-bold text-gray-700">Zone not found</p>
            <p className="text-xs text-gray-400 mt-1">
              This zone may have been deleted or the ID is incorrect.
            </p>
          </div>
          <Link
            href="/admin/zones"
            className="flex items-center gap-1.5 text-xs font-semibold text-primary-700 hover:underline"
          >
            <ArrowLeft size={13} /> Back to zones
          </Link>
        </div>
      </div>
    );
  }

  return (
    <ZoneForm
      initialData={zone}
      onSubmit={handleSubmit}
      isPending={isUpdatingZone}
    />
  );
}
