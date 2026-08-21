'use client';

import { useState } from 'react';
import {
  DollarSign,
  Plus,
  Pencil,
  Trash2,
  Star,
  Loader2,
  RefreshCw,
  ArrowUpDown,
} from 'lucide-react';
import { useGetCurrencies } from '../../hooks/currencies/useGetCurrencies';
import { useCreateCurrency } from '../../hooks/currencies/useCreateCurrency';
import { useUpdateCurrency } from '../../hooks/currencies/useUpdateCurrency';
import { useDeleteCurrency } from '../../hooks/currencies/useDeleteCurrency';
import AdminCurrencyModal from './AdminCurrencyModal';
import AdminSearchInput from '../../components/admin/AdminSearchInput';
import FilterMenu from '../../components/admin/FilterMenu';
import AdminFab from '../../components/admin/AdminFab';

function fmtDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function fmtRate(rate) {
  if (rate == null) return '—';
  return Number(rate).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 6,
  });
}

export default function AdminCurrenciesPage() {
  const [modal, setModal] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('base_first');

  const { currencies = [], isLoadingCurrencies } = useGetCurrencies({
    search: search.trim() || undefined,
    sort,
  });
  const { createCurrency, isCreatingCurrency } = useCreateCurrency();
  const { updateCurrency, isUpdatingCurrency } = useUpdateCurrency();
  const { deleteCurrency, isDeletingCurrency } = useDeleteCurrency();

  const saving = isCreatingCurrency || isUpdatingCurrency;

  function handleSave(form) {
    const payload = {
      code: form.code,
      name: form.name,
      symbol: form.symbol,
      rate: Number(form.rate),
      isBaseCurrency: form.isBaseCurrency,
    };
    if (modal === 'new') {
      createCurrency(payload, { onSuccess: () => setModal(null) });
    } else {
      updateCurrency(
        { code: modal.code, currencyData: payload },
        { onSuccess: () => setModal(null) },
      );
    }
  }

  function handleDelete(code) {
    deleteCurrency(code, { onSettled: () => setDeleteId(null) });
  }

  return (
    <>
      {modal && (
        <AdminCurrencyModal
          initial={modal === 'new' ? null : modal}
          onClose={() => setModal(null)}
          onSave={handleSave}
          saving={saving}
        />
      )}

      <div className="max-w-7xl mx-auto space-y-5">
        <div>
          <h2 className="text-2xl font-extrabold text-gray-900">Currencies</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            {currencies.length} {currencies.length === 1 ? 'currency' : 'currencies'} configured
          </p>
        </div>

        <AdminFab onClick={() => setModal('new')} label="Add currency" />

        <div className="flex items-center gap-3">
          <AdminSearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search by code, name, or symbol"
            className="flex-1"
          />
          <FilterMenu
            value={sort}
            onChange={setSort}
            icon={ArrowUpDown}
            options={[
              { value: 'base_first', label: 'Base First' },
              { value: 'code_asc', label: 'Code A-Z' },
              { value: 'code_desc', label: 'Code Z-A' },
              { value: 'rate_asc', label: 'Rate Low-High' },
              { value: 'rate_desc', label: 'Rate High-Low' },
              { value: 'updated_desc', label: 'Recently Updated' },
              { value: 'updated_asc', label: 'Oldest Updated' },
            ]}
            label="Sort currencies"
          />
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
          {isLoadingCurrencies ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 size={22} className="animate-spin text-gray-300" />
            </div>
          ) : currencies.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center">
                <DollarSign size={22} className="text-gray-400" />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-600">No currencies yet</p>
                <p className="text-xs text-gray-400 mt-1">Add your first currency to get started.</p>
              </div>
              <button
                onClick={() => setModal('new')}
                className="flex items-center gap-1.5 text-xs font-bold bg-primary-700 hover:bg-primary-800 text-white px-4 py-2 rounded-xl transition-colors"
              >
                <Plus size={13} /> Add Currency
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[640px]">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/60">
                    {['Code', 'Name', 'Symbol', 'Rate', 'Last Updated', ''].map((h, i) => (
                      <th
                        key={i}
                        className="text-left text-[11px] font-bold text-gray-400 uppercase tracking-wide px-4 py-3 whitespace-nowrap"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {currencies.map((cur) => (
                    <tr
                      key={cur.code}
                      className={`hover:bg-gray-50/60 transition-colors group ${isDeletingCurrency ? 'pointer-events-none' : ''}`}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-gray-900 text-sm">{cur.code}</span>
                          {cur.isBaseCurrency && (
                            <span className="flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-full">
                              <Star size={9} className="fill-amber-400 text-amber-400" /> Base
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 font-medium text-gray-700">{cur.name}</td>
                      <td className="px-4 py-3">
                        <span className="font-mono text-gray-500 bg-gray-50 border border-gray-100 px-2 py-0.5 rounded text-xs">
                          {cur.symbol}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono text-gray-700">{fmtRate(cur.rate)}</td>
                      <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">
                        <span className="flex items-center gap-1.5">
                          <RefreshCw size={11} />
                          {fmtDate(cur.lastUpdated ?? cur.updatedAt)}
                        </span>
                      </td>
                      <td className="px-4 py-3 w-32">
                        {deleteId === cur.code ? (
                          <div className="flex items-center gap-1.5 text-xs">
                            <span className="text-red-600 font-semibold whitespace-nowrap">Delete?</span>
                            <button
                              onClick={() => handleDelete(cur.code)}
                              className="font-bold px-2 py-1 rounded bg-red-50 text-red-600 hover:bg-red-100 transition whitespace-nowrap"
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
                            <button
                              onClick={() => setModal(cur)}
                              className="p-1.5 rounded-lg text-gray-400 hover:text-primary-700 hover:bg-primary-50 transition"
                              title="Edit"
                            >
                              <Pencil size={14} />
                            </button>
                            <button
                              onClick={() => setDeleteId(cur.code)}
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
        </div>
      </div>
    </>
  );
}
