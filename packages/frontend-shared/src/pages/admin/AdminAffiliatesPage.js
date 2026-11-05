'use client';

import { Suspense, useState } from 'react';
import { Handshake, Plus, Pencil, Trash2, Loader2, ChevronLeft, ChevronRight, Eye, ArrowUpDown, Wallet } from 'lucide-react';
import { Modal } from '../../components/admin/ModalShell';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useGetAffiliates } from '../../hooks/affiliates/useGetAffiliates';
import { useCreateAffiliate } from '../../hooks/affiliates/useCreateAffiliate';
import { useUpdateAffiliate } from '../../hooks/affiliates/useUpdateAffiliate';
import { useDeleteAffiliate } from '../../hooks/affiliates/useDeleteAffiliate';
import { useToggleAffiliateStatus } from '../../hooks/affiliates/useToggleAffiliateStatus';
import AdminSearchInput from '../../components/admin/AdminSearchInput';
import FilterMenu from '../../components/admin/FilterMenu';
import AdminFab from '../../components/admin/AdminFab';
import { fmtDate } from '../../components/admin/format';
import { Toggle } from '../../components/admin/DetailCard';
import { Pagination } from '../../components/admin/Pagination';
import { AdminSuspense } from '../../components/admin/AdminSuspense';
import { inputSoftCls as inputCls } from '../../components/admin/formClasses';


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
    <Modal
      size="md"
      title={isEdit ? 'Edit Affiliate' : 'New Affiliate'}
      subtitle={isEdit ? `ID: ${initial.affiliateId}` : null}
      subtitleClass="text-[11px] text-gray-400 mt-0.5 font-mono"
      onClose={onClose}
    >

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
    </Modal>
  );
}

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

        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h2 className="text-2xl font-extrabold text-gray-900">Affiliates</h2>
            <p className="text-sm text-gray-500 mt-0.5">
              {pagination?.totalDocs != null ? `${pagination.totalDocs} affiliate${pagination.totalDocs !== 1 ? 's' : ''}` : 'Manage affiliate partners'}
            </p>
          </div>
          <Link
            href="/admin/affiliates/payouts"
            className="inline-flex items-center gap-2 text-xs font-bold px-4 py-2.5 border border-gray-200 hover:border-primary-300 hover:text-primary-700 text-gray-600 rounded-xl transition shrink-0"
          >
            <Wallet size={13} /> Payouts
          </Link>
        </div>

        <AdminFab onClick={() => setModal('new')} label="New affiliate" />

        <div className="flex items-center gap-3">
          <AdminSearchInput
            value={search}
            onChange={(value) => updateParams({ q: value })}
            placeholder="Search affiliates..."
            className="flex-1"
          />
          <FilterMenu
            value={activeFilter}
            onChange={(value) => updateParams({ isActive: value })}
            options={[
              { value: 'all', label: 'All statuses' },
              { value: 'true', label: 'Active only' },
              { value: 'false', label: 'Inactive only' },
            ]}
            label="Filter affiliates"
          />
          <FilterMenu
            value={sort}
            onChange={(value) => updateParams({ sort: value })}
            icon={ArrowUpDown}
            options={[
              { value: 'newest', label: 'Newest' },
              { value: 'oldest', label: 'Oldest' },
              { value: 'name_asc', label: 'Name A-Z' },
              { value: 'name_desc', label: 'Name Z-A' },
              { value: 'commission_desc', label: 'Highest commission' },
              { value: 'commission_asc', label: 'Lowest commission' },
            ]}
            label="Sort affiliates"
          />
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">

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

                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-accent-100 flex items-center justify-center shrink-0">
                              <span className="text-xs font-bold text-accent-700">
                                {aff.name?.charAt(0).toUpperCase() ?? '?'}
                              </span>
                            </div>
                            <div>
                              <Link href={`/admin/affiliates/${aff._id}`} className="block font-semibold text-gray-900 leading-snug hover:text-primary-700 hover:underline transition-colors">{aff.name}</Link>
                              <p className="text-[11px] text-gray-400">{aff.email}</p>
                            </div>
                          </div>
                        </td>

                        <td className="px-4 py-3">
                          <span className="font-mono text-xs text-gray-500 bg-gray-50 border border-gray-100 px-2 py-0.5 rounded tracking-widest">
                            {aff.affiliateId}
                          </span>
                        </td>

                        <td className="px-4 py-3">
                          <span className="text-sm font-semibold text-gray-800">{aff.commissionPercent}%</span>
                        </td>

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

                        <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">{fmtDate(aff.createdAt)}</td>

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

              <Pagination page={page} totalPages={totalPages} onPageChange={goToPage} labelSize="text-xs" />
            </>
          )}
        </div>
      </div>
    </>
  );
}

export default function AdminAffiliatesPage() {
  return (
    <AdminSuspense>
      <AffiliatesContent />
    </AdminSuspense>
  );
}
