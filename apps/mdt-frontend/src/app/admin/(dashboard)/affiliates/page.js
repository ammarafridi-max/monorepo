'use client';

import { Suspense, useState } from 'react';
import { Handshake, Plus, Pencil, Trash2, X, Loader2, ChevronLeft, ChevronRight, Eye, Search } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams }    from 'next/navigation';
import { useGetAffiliates }           from '@travel-suite/frontend-shared/hooks/affiliates/useGetAffiliates';
import { useCreateAffiliate }         from '@travel-suite/frontend-shared/hooks/affiliates/useCreateAffiliate';
import { useUpdateAffiliate }         from '@travel-suite/frontend-shared/hooks/affiliates/useUpdateAffiliate';
import { useDeleteAffiliate }         from '@travel-suite/frontend-shared/hooks/affiliates/useDeleteAffiliate';
import { useToggleAffiliateStatus }   from '@travel-suite/frontend-shared/hooks/affiliates/useToggleAffiliateStatus';

/* --- Helpers ---------------------------------------------------------------- */

function fmtDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

/* --- Toggle switch ----------------------------------------------------------- */

function Toggle({ checked, onChange, disabled }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={onChange}
      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed ${
        checked ? 'bg-green-500' : 'bg-gray-200'
      }`}
    >
      <span
        className={`pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow-sm ring-0 transition-transform duration-200 ${
          checked ? 'translate-x-4' : 'translate-x-0'
        }`}
      />
    </button>
  );
}

/* --- Modal ------------------------------------------------------------------ */

const inputCls =
  'w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 placeholder:text-gray-300 transition disabled:bg-gray-50 disabled:text-gray-400';

function AffiliateModal({ initial, onClose, onSave, saving }) {
  const isEdit = !!initial;
  const [form, setForm] = useState(
    isEdit
      ? { name: initial.name, email: initial.email, commissionPercent: String(initial.commissionPercent), isActive: initial.isActive }
      : { name: '', email: '', commissionPercent: '25', isActive: true },
  );

  function set(key, value) { setForm((p) => ({ ...p, [key]: value })); }

  const canSave = form.name.trim() && form.email.trim() && form.commissionPercent !== '';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <p className="text-sm font-bold text-gray-900">{isEdit ? 'Edit Affiliate' : 'New Affiliate'}</p>
            {isEdit && (
              <p className="text-[11px] text-gray-400 mt-0.5 font-mono">ID: {initial.affiliateId}</p>
            )}
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition">
            <X size={15} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Full Name <span className="text-red-500">*</span></label>
            <input type="text" value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="Partner Agency Ltd." className={inputCls} />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Email <span className="text-red-500">*</span></label>
            <input type="email" value={form.email} onChange={(e) => set('email', e.target.value)} placeholder="partner@example.com" disabled={isEdit} className={inputCls} />
            {isEdit && <p className="text-[11px] text-gray-400 mt-1">Email cannot be changed after creation.</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Commission % <span className="text-red-500">*</span></label>
            <div className="relative">
              <input
                type="number"
                value={form.commissionPercent}
                onChange={(e) => set('commissionPercent', e.target.value)}
                placeholder="25"
                min="0" max="100" step="0.5"
                className={`${inputCls} pr-8`}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 font-medium">%</span>
            </div>
          </div>

          {isEdit && (
            <label className="flex items-center justify-between p-3 rounded-xl border border-gray-100 hover:bg-gray-50 cursor-pointer transition">
              <div>
                <p className="text-xs font-semibold text-gray-700">Active</p>
                <p className="text-[11px] text-gray-400">Inactive affiliates cannot earn commissions.</p>
              </div>
              <Toggle checked={form.isActive} onChange={() => set('isActive', !form.isActive)} />
            </label>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-gray-100 bg-gray-50/60">
          <button onClick={onClose} className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-xl transition">Cancel</button>
          <button
            onClick={() => onSave(form)}
            disabled={!canSave || saving}
            className="flex items-center gap-2 px-4 py-2 text-xs font-bold bg-primary-700 hover:bg-primary-800 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl transition"
          >
            {saving && <Loader2 size={12} className="animate-spin" />}
            {isEdit ? 'Save Changes' : 'Create Affiliate'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* --- Content (needs Suspense because useAffiliates uses useSearchParams) --- */

function AffiliatesContent() {
  const router       = useRouter();
  const searchParams = useSearchParams();

  const [modal,    setModal]    = useState(null);
  const [deleteId, setDeleteId] = useState(null);

  const { affiliates, pagination, isLoadingAffiliates } = useGetAffiliates();
  const { createAffiliate,      isCreatingAffiliate      } = useCreateAffiliate();
  const { updateAffiliate,      isUpdatingAffiliate      } = useUpdateAffiliate();
  const { deleteAffiliate,      isDeletingAffiliate      } = useDeleteAffiliate();
  const { toggleAffiliateStatus, isTogglingAffiliateStatus } = useToggleAffiliateStatus();

  const saving = isCreatingAffiliate || isUpdatingAffiliate;

  const page       = Number(searchParams.get('page') || 1);
  const totalPages = pagination?.totalPages ?? 1;
  const search = searchParams.get('q') || '';
  const sort = searchParams.get('sort') || 'newest';
  const activeFilter = searchParams.get('isActive') || 'all';

  function goToPage(p) {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', String(p));
    router.push(`?${params.toString()}`);
  }

  function updateParams(nextParams) {
    const params = new URLSearchParams(searchParams.toString());

    Object.entries(nextParams).forEach(([key, value]) => {
      if (value === undefined || value === null || value === '' || value === 'all') {
        params.delete(key);
      } else {
        params.set(key, String(value));
      }
    });

    params.set('page', '1');
    router.push(`?${params.toString()}`);
  }

  function handleSave(form) {
    const payload = {
      name:              form.name.trim(),
      email:             form.email.trim(),
      commissionPercent: Number(form.commissionPercent),
      ...(modal !== 'new' && { isActive: form.isActive }),
    };

    if (modal === 'new') {
      createAffiliate(payload, { onSuccess: () => setModal(null) });
    } else {
      updateAffiliate({ id: modal._id, payload }, { onSuccess: () => setModal(null) });
    }
  }

  function handleDelete(id) {
    deleteAffiliate(id, { onSettled: () => setDeleteId(null) });
  }

  return (
    <>
      {modal && (
        <AffiliateModal
          initial={modal === 'new' ? null : modal}
          onClose={() => setModal(null)}
          onSave={handleSave}
          saving={saving}
        />
      )}

      <div className="max-w-7xl mx-auto space-y-5">

        {/* Header */}
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-extrabold text-gray-900">Affiliates</h2>
            <p className="text-sm text-gray-400 mt-0.5">
              {pagination?.totalDocs != null ? `${pagination.totalDocs} affiliate${pagination.totalDocs !== 1 ? 's' : ''}` : 'Manage affiliate partners'}
            </p>
          </div>
          <button
            onClick={() => setModal('new')}
            className="flex items-center gap-2 bg-primary-700 hover:bg-primary-800 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-colors"
          >
            <Plus size={14} /> New Affiliate
          </button>
        </div>

        {/* Table card */}
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative w-full max-w-sm">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              <input
                type="text"
                value={search}
                onChange={(e) => updateParams({ q: e.target.value })}
                placeholder="Search affiliates..."
                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 placeholder:text-gray-300"
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <select
                value={activeFilter}
                onChange={(e) => updateParams({ isActive: e.target.value })}
                className="px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
              >
                <option value="all">All statuses</option>
                <option value="true">Active only</option>
                <option value="false">Inactive only</option>
              </select>

              <select
                value={sort}
                onChange={(e) => updateParams({ sort: e.target.value })}
                className="px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
              >
                <option value="newest">Newest</option>
                <option value="oldest">Oldest</option>
                <option value="name_asc">Name A-Z</option>
                <option value="name_desc">Name Z-A</option>
                <option value="commission_desc">Highest commission</option>
                <option value="commission_asc">Lowest commission</option>
              </select>
            </div>
          </div>

          {isLoadingAffiliates ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 size={22} className="animate-spin text-gray-300" />
            </div>
          ) : affiliates.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center">
                <Handshake size={22} className="text-gray-400" />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-600">No affiliates yet</p>
                <p className="text-xs text-gray-400 mt-1">Add your first affiliate partner to start tracking commissions.</p>
              </div>
              <button onClick={() => setModal('new')} className="flex items-center gap-1.5 text-xs font-bold bg-primary-700 hover:bg-primary-800 text-white px-4 py-2 rounded-xl transition-colors">
                <Plus size={13} /> New Affiliate
              </button>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[700px]">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50/60">
                      {['Affiliate', 'ID', 'Commission', 'Status', 'Created', ''].map((h, i) => (
                        <th key={i} className="text-left text-[11px] font-bold text-gray-400 uppercase tracking-wide px-4 py-3 whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {affiliates.map((aff) => (
                      <tr key={aff._id} className={`hover:bg-gray-50/60 transition-colors group ${isDeletingAffiliate ? 'pointer-events-none' : ''}`}>

                        {/* Affiliate name + email */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-accent-100 flex items-center justify-center shrink-0">
                              <span className="text-xs font-bold text-accent-700">
                                {aff.name?.charAt(0).toUpperCase() ?? '?'}
                              </span>
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900 leading-snug">{aff.name}</p>
                              <p className="text-[11px] text-gray-400">{aff.email}</p>
                            </div>
                          </div>
                        </td>

                        {/* Affiliate ID */}
                        <td className="px-4 py-3">
                          <span className="font-mono text-xs text-gray-500 bg-gray-50 border border-gray-100 px-2 py-0.5 rounded tracking-widest">
                            {aff.affiliateId}
                          </span>
                        </td>

                        {/* Commission */}
                        <td className="px-4 py-3">
                          <span className="text-sm font-semibold text-gray-800">{aff.commissionPercent}%</span>
                        </td>

                        {/* Status toggle */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <Toggle
                              checked={aff.isActive}
                              disabled={isTogglingAffiliateStatus}
                              onChange={() => toggleAffiliateStatus({ id: aff._id, isActive: !aff.isActive })}
                            />
                            <span className={`text-xs font-medium ${aff.isActive ? 'text-green-600' : 'text-gray-400'}`}>
                              {aff.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                        </td>

                        {/* Created */}
                        <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">{fmtDate(aff.createdAt)}</td>

                        {/* Actions */}
                        <td className="px-4 py-3 w-28">
                          {deleteId === aff._id ? (
                            <div className="flex items-center gap-1.5 text-xs">
                              <span className="text-red-600 font-semibold whitespace-nowrap">Delete?</span>
                              <button onClick={() => handleDelete(aff._id)} className="font-bold px-2 py-1 rounded bg-red-50 text-red-600 hover:bg-red-100 transition whitespace-nowrap">Yes</button>
                              <button onClick={() => setDeleteId(null)} className="font-bold px-2 py-1 rounded bg-gray-50 text-gray-500 hover:bg-gray-100 transition">No</button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Link href={`/admin/affiliates/${aff._id}`} className="p-1.5 rounded-lg text-gray-400 hover:text-primary-700 hover:bg-primary-50 transition" title="View">
                                <Eye size={14} />
                              </Link>
                              <button onClick={() => setModal(aff)} className="p-1.5 rounded-lg text-gray-400 hover:text-primary-700 hover:bg-primary-50 transition" title="Edit">
                                <Pencil size={14} />
                              </button>
                              <button onClick={() => setDeleteId(aff._id)} className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition" title="Delete">
                                <Trash2 size={14} />
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
                  <p className="text-xs text-gray-400">Page {page} of {totalPages}</p>
                  <div className="flex items-center gap-2">
                    <button disabled={page === 1} onClick={() => goToPage(page - 1)} className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:border-primary-300 hover:text-primary-700 disabled:opacity-40 disabled:cursor-not-allowed transition">
                      <ChevronLeft size={14} />
                    </button>
                    <button disabled={page === totalPages} onClick={() => goToPage(page + 1)} className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:border-primary-300 hover:text-primary-700 disabled:opacity-40 disabled:cursor-not-allowed transition">
                      <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}

/* --- Page — Suspense required because useAffiliates calls useSearchParams -- */

export default function AffiliatesPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 size={24} className="animate-spin text-gray-300" />
      </div>
    }>
      <AffiliatesContent />
    </Suspense>
  );
}
