'use client';

import { useRouter } from 'next/navigation';
import ZoneForm from '../../components/admin/ZoneForm';
import { useCreateZone } from '../../hooks/zones/useCreateZone';

export default function AdminNewZonePage() {
  const router = useRouter();
  const { createZone, isCreatingZone } = useCreateZone();

  function handleSubmit(zoneData) {
    createZone(zoneData, {
      onSuccess: () => router.push('/admin/zones'),
    });
  }

  return <ZoneForm onSubmit={handleSubmit} isPending={isCreatingZone} />;
}
