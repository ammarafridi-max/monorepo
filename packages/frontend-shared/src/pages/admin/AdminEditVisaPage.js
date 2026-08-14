'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Loader2, AlertCircle, Layers, MapPin } from 'lucide-react';
import Link from 'next/link';
import VisaForm        from '../../components/admin/VisaForm.js';
import VisaOverlayForm from '../../components/admin/VisaOverlayForm.js';
import { useGetVisa }       from '../../hooks/visa/useGetVisa.js';
import { useUpdateVisa }    from '../../hooks/visa/useUpdateVisa.js';
import { usePublishVisa }   from '../../hooks/visa/usePublishVisa.js';
import { useUnpublishVisa } from '../../hooks/visa/useUnpublishVisa.js';
import { useVisaOverlays }  from '../../hooks/visa/useVisaOverlays.js';
import { useUpsertOverlay } from '../../hooks/visa/useUpsertOverlay.js';
import { useDeleteOverlay } from '../../hooks/visa/useDeleteOverlay.js';

export default function AdminEditVisaPage({ countries = [], siteUrl = '' }) {
  const { id } = useParams();
  const router = useRouter();
  const [tab, setTab] = useState('base');

  const { visa, isLoadingVisa, isErrorVisa } = useGetVisa(id);
  const { updateVisa,    isUpdatingVisa     } = useUpdateVisa();
  const { publishVisa,   isPublishingVisa   } = usePublishVisa();
  const { unpublishVisa, isUnpublishingVisa } = useUnpublishVisa();

  const { byResidence, isLoadingOverlays } = useVisaOverlays(visa?.slug);
  const { upsertOverlay, isSavingOverlay } = useUpsertOverlay();
  const { deleteOverlay, isDeletingOverlay } = useDeleteOverlay();

  function handleSubmit({ data, file }) {
    updateVisa({ id, data, file }, { onSuccess: () => router.push('/admin/visa') });
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
          <Link href="/admin/visa" className="flex items-center gap-1.5 text-xs font-semibold text-primary-700 hover:underline">
            <ArrowLeft size={13} /> Back to visa pages
          </Link>
        </div>
      </div>
    );
  }

  const baseForm = (
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

  if (!countries.length) return baseForm;

  const active = countries.find((c) => c.slug === tab) || null;

  return (
    <div>
      <div className="max-w-4xl mx-auto px-5 pt-5">
        <div className="flex items-center gap-1 p-1 rounded-2xl bg-gray-100 overflow-x-auto">
          <TabButton
            active={tab === 'base'}
            onClick={() => setTab('base')}
            icon={<Layers size={13} />}
            label="Base"
            sub="all countries"
          />
          {countries.map((c) => {
            const o = byResidence[c.code];
            return (
              <TabButton
                key={c.slug}
                active={tab === c.slug}
                onClick={() => setTab(c.slug)}
                icon={<MapPin size={13} />}
                label={c.short || c.name}
                sub={o ? (o.isPublished ? 'live' : 'draft') : 'not set up'}
                dot={o ? (o.isPublished ? 'bg-green-500' : 'bg-amber-400') : null}
              />
            );
          })}
        </div>

        <p className="mt-2.5 text-[11px] text-gray-400">
          {tab === 'base'
            ? 'Shared content. Changes here reach every country that has not overridden them.'
            : `Only what is different in ${active?.name}. Everything else comes from the base tab.`}
        </p>
      </div>

      {tab === 'base' && <div className="mt-1">{baseForm}</div>}

      {active && (
        isLoadingOverlays ? (
          <div className="flex items-center justify-center py-20 text-gray-400">
            <Loader2 size={22} className="animate-spin" />
          </div>
        ) : (
          <div className="max-w-4xl mx-auto px-5 py-5">
            <VisaOverlayForm
              // Remount on tab change so each country gets its own form state.
              key={active.slug}
              base={visa}
              country={active}
              overlay={byResidence[active.code] || null}
              siteUrl={siteUrl}
              isSaving={isSavingOverlay}
              isRemoving={isDeletingOverlay}
              onSave={(payload, markClean) =>
                upsertOverlay(payload, { onSuccess: () => markClean?.() })
              }
              onRemove={() => {
                if (!confirm(`Remove the ${active.name} version? The base page stays untouched.`)) return;
                deleteOverlay({
                  residence: active.code,
                  visaSlug: visa.slug,
                  residenceName: active.name,
                });
              }}
            />
          </div>
        )
      )}
    </div>
  );
}

function TabButton({ active, onClick, icon, label, sub, dot }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2 rounded-xl text-left whitespace-nowrap transition cursor-pointer ${
        active ? 'bg-white shadow-sm' : 'hover:bg-gray-200/60'
      }`}
    >
      <span className={active ? 'text-primary-700' : 'text-gray-400'}>{icon}</span>
      <span className="min-w-0">
        <span className={`block text-xs font-bold ${active ? 'text-gray-900' : 'text-gray-600'}`}>{label}</span>
        <span className="flex items-center gap-1 text-[10px] text-gray-400">
          {dot && <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />}
          {sub}
        </span>
      </span>
    </button>
  );
}
