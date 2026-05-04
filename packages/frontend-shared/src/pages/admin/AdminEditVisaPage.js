'use client';

import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Loader2, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import VisaForm       from '../../components/v1/admin/VisaForm.js';
import { useGetVisa }      from '../../hooks/visa/useGetVisa.js';
import { useUpdateVisa }   from '../../hooks/visa/useUpdateVisa.js';
import { usePublishVisa }  from '../../hooks/visa/usePublishVisa.js';
import { useUnpublishVisa } from '../../hooks/visa/useUnpublishVisa.js';

export default function AdminEditVisaPage() {
  const { id } = useParams();
  const router = useRouter();

  const { visa, isLoadingVisa, isErrorVisa } = useGetVisa(id);
  const { updateVisa,   isUpdatingVisa    } = useUpdateVisa();
  const { publishVisa,  isPublishingVisa  } = usePublishVisa();
  const { unpublishVisa, isUnpublishingVisa } = useUnpublishVisa();

  function handleSubmit({ data, file }) {
    updateVisa(
      { id, data, file },
      { onSuccess: () => router.push('/admin/visa') },
    );
  }

  if (isLoadingVisa) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3 text-gray-400">
          <Loader2 size={28} className="animate-spin" />
          <p className="text-sm font-medium">Loading visa page…</p>
        </div>
      </div>
    );
  }

  if (isErrorVisa || !visa) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4 text-center max-w-xs">
          <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center">
            <AlertCircle size={24} className="text-red-400" />
          </div>
          <div>
            <p className="text-sm font-bold text-gray-700">Visa page not found</p>
            <p className="text-xs text-gray-400 mt-1">
              This page may have been deleted or the ID is incorrect.
            </p>
          </div>
          <Link
            href="/admin/visa"
            className="flex items-center gap-1.5 text-xs font-semibold text-primary-700 hover:underline"
          >
            <ArrowLeft size={13} /> Back to visa pages
          </Link>
        </div>
      </div>
    );
  }

  return (
    <VisaForm
      initialData={visa}
      onSubmit={handleSubmit}
      isPending={isUpdatingVisa}
      onPublish={() => publishVisa(id)}
      onUnpublish={() => unpublishVisa(id)}
      isPublishing={isPublishingVisa}
      isUnpublishing={isUnpublishingVisa}
    />
  );
}
