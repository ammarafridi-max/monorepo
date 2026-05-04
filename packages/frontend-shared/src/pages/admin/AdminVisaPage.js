'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Layers, Plus, Search, Pencil, Globe, EyeOff,
  Copy, Trash2, X, ChevronLeft, ChevronRight, Loader2,
} from 'lucide-react';
import { useGetAdminVisas }  from '../../hooks/visa/useGetAdminVisas.js';
import { useDeleteVisa }     from '../../hooks/visa/useDeleteVisa.js';
import { useDuplicateVisa }  from '../../hooks/visa/useDuplicateVisa.js';
import { usePublishVisa }    from '../../hooks/visa/usePublishVisa.js';
import { useUnpublishVisa }  from '../../hooks/visa/useUnpublishVisa.js';

const STATUS_TABS = ['all', 'published', 'draft'];

const STATUS_CFG = {
  published: { label: 'Published', dot: 'bg-green-500', cls: 'bg-green-50 text-green-700 border-green-200' },
  draft:     { label: 'Draft',     dot: 'bg-gray-400',  cls: 'bg-gray-100 text-gray-600 border-gray-200'  },
};

function StatusBadge({ status }) {
  const cfg = STATUS_CFG[status] ?? STATUS_CFG.draft;
  return (
    <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2 py-0.5 rounded-full border ${cfg.cls}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

function fmtDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function AdminVisaPage() {
  const [statusFilter, setStatusFilter] = useState('all');
  const [search,       setSearch]       = useState('');
  const [page,         setPage]         = useState(1);
  const [deleteId,     setDeleteId]     = useState(null);
  const [loadingId,    setLoadingId]    = useState(null);

  const { visas, pagination, isLoadingVisas } = useGetAdminVisas({
    page,
    limit: 20,
    status: statusFilter !== 'all' ? statusFilter : undefined,
    search: search.trim() || undefined,
  });

  const totalPages = pagination?.totalPages ?? 1;
  const total      = pagination?.total      ?? 0;

  const { deleteVisa,     isDeletingVisa     } = useDeleteVisa();
  const { duplicateVisa,  isDuplicatingVisa  } = useDuplicateVisa();
  const { publishVisa,    isPublishingVisa   } = usePublishVisa();
  const { unpublishVisa,  isUnpublishingVisa } = useUnpublishVisa();

  const isWorking = isDeletingVisa || isDuplicatingVisa || isPublishingVisa || isUnpublishingVisa;

  function handleTogglePublish(visa) {
    setLoadingId(visa._id);
    if (visa.status === 'published') {
      unpublishVisa(visa._id, { onSettled: () => setLoadingId(null) });
    } else {
      publishVisa(visa._id, { onSettled: () => setLoadingId(null) });
    }
  }

  function handleDuplicate(id) {
    setLoadingId(id);
    duplicateVisa(id, { onSettled: () => setLoadingId(null) });
  }

  function handleDelete(id) {
    setLoadingId(id);
    deleteVisa(id, { onSettled: () => { setDeleteId(null); setLoadingId(null); } });
  }

  return (
    <div className="max-w-7xl mx-auto space-y-5">

      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-gray-900">Visa Pages</h2>
          <p className="text-sm text-gray-400 mt-0.5">
            {isLoadingVisas ? 'Loading…' : `${total} visa page${total !== 1 ? 's' : ''}${statusFilter !== 'all' ? ` · ${STATUS_CFG[statusFilter]?.label}` : ' total'}`}
          </p>
        </div>
        <Link
          href="/admin/visa/new"
          className="flex items-center gap-2 bg-primary-700 hover:bg-primary-800 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-colors"
        >
          <Plus size={14} />
          New Visa Page
        </Link>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">

        <div className="flex items-center gap-0.5 px-4 pt-4 border-b border-gray-100">
          {STATUS_TABS.map((key) => {
            const label    = key === 'all' ? 'All' : STATUS_CFG[key]?.label ?? key;
            const isActive = statusFilter === key;
            return (
              <button
                key={key}
                onClick={() => { setStatusFilter(key); setPage(1); }}
                className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-t-lg border-b-2 transition-colors -mb-px ${
                  isActive
                    ? 'border-primary-700 text-primary-700'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-200'
                }`}
              >
                {label}
                {isActive && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-primary-700 text-white">
                    {total}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div className="px-4 py-3 border-b border-gray-100">
          <div className="relative max-w-sm">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search by country or slug…"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full pl-9 pr-8 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white placeholder:text-gray-300"
            />
            {search && (
              <button
                onClick={() => { setSearch(''); setPage(1); }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X size={13} />
              </button>
            )}
          </div>
        </div>

        {isLoadingVisas ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={22} className="animate-spin text-gray-300" />
          </div>
        ) : visas.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
            <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
              <Layers size={22} className="text-gray-400" />
            </div>
            <p className="text-sm font-bold text-gray-600">No visa pages found</p>
            <p className="text-xs text-gray-400 mt-1 mb-5">
              {search ? 'Try a different search term.' : 'Create your first visa destination page.'}
            </p>
            {!search && (
              <Link
                href="/admin/visa/new"
                className="flex items-center gap-1.5 text-xs font-bold bg-primary-700 hover:bg-primary-800 text-white px-4 py-2 rounded-xl transition-colors"
              >
                <Plus size={13} /> New Visa Page
              </Link>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[760px]">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/60">
                  {['Country', 'Slug', 'Packages', 'Status', 'Updated', ''].map((h, i) => (
                    <th key={i} className="text-left text-[11px] font-bold text-gray-400 uppercase tracking-wide px-4 py-3 whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {visas.map((visa) => (
                  <tr
                    key={visa._id}
                    className={`hover:bg-gray-50/60 transition-colors group ${isWorking && loadingId === visa._id ? 'opacity-50 pointer-events-none' : ''}`}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {visa.heroImageUrl ? (
                          <img
                            src={visa.heroImageUrl}
                            alt=""
                            className="w-10 h-10 rounded-lg object-cover border border-gray-100 shrink-0"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                            <Layers size={14} className="text-gray-400" />
                          </div>
                        )}
                        <p className="font-semibold text-gray-900 truncate max-w-[180px]">
                          {visa.countryName || '—'}
                        </p>
                      </div>
                    </td>

                    <td className="px-4 py-3 text-xs text-gray-400 font-mono max-w-[160px] truncate">
                      {visa.slug || '—'}
                    </td>

                    <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                      {visa.packages?.length ?? 0} / 3
                    </td>

                    <td className="px-4 py-3 whitespace-nowrap">
                      <StatusBadge status={visa.status} />
                    </td>

                    <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">
                      {fmtDate(visa.updatedAt)}
                    </td>

                    <td className="px-4 py-3 w-40">
                      {deleteId === visa._id ? (
                        <div className="flex items-center gap-1.5 text-xs">
                          <span className="text-red-600 font-semibold whitespace-nowrap">Delete?</span>
                          <button
                            onClick={() => handleDelete(visa._id)}
                            className="font-bold px-2 py-1 rounded bg-red-50 text-red-600 hover:bg-red-100 transition"
                          >
                            Yes
                          </button>
                          <button
                            onClick={() => setDeleteId(null)}
                            className="font-bold px-2 py-1 rounded bg-gray-50 text-gray-500 hover:bg-gray-100 transition"
                          >
                            No
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Link
                            href={`/admin/visa/${visa._id}/edit`}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-primary-700 hover:bg-primary-50 transition"
                            title="Edit"
                          >
                            <Pencil size={14} />
                          </Link>
                          <button
                            onClick={() => handleTogglePublish(visa)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-green-600 hover:bg-green-50 transition"
                            title={visa.status === 'published' ? 'Unpublish' : 'Publish'}
                          >
                            {visa.status === 'published' ? <EyeOff size={14} /> : <Globe size={14} />}
                          </button>
                          <button
                            onClick={() => handleDuplicate(visa._id)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition"
                            title="Duplicate"
                          >
                            <Copy size={14} />
                          </button>
                          <button
                            onClick={() => setDeleteId(visa._id)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition"
                            title="Delete"
                          >
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
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
            <p className="text-xs text-gray-400">Page {page} of {totalPages}</p>
            <div className="flex items-center gap-2">
              <button
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
                className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:border-primary-300 hover:text-primary-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                <ChevronLeft size={14} />
              </button>
              <button
                disabled={page === totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:border-primary-300 hover:text-primary-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
