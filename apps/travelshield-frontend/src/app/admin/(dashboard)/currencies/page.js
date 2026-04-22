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
  Search,
  ArrowUpDown,
} from 'lucide-react';
import { useGetCurrencies } from '@travel-suite/frontend-shared/hooks/currencies/useGetCurrencies';
import { useCreateCurrency } from '@travel-suite/frontend-shared/hooks/currencies/useCreateCurrency';
import { useUpdateCurrency } from '@travel-suite/frontend-shared/hooks/currencies/useUpdateCurrency';
import { useDeleteCurrency } from '@travel-suite/frontend-shared/hooks/currencies/useDeleteCurrency';
import CurrencyModal from './CurrencyModal';

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

export default function CurrenciesPage() {
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
        <CurrencyModal
          initial={modal === 'new' ? null : modal}
          onClose={() => setModal(null)}
          onSave={handleSave}
          saving={saving}
        />
      )}

      <div className="max-w-7xl mx-auto space-y-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-extrabold text-gray-900">
              Currencies
            </h2>
            <p className="text-sm text-gray-400 mt-0.5">
              {currencies.length} {currencies.length === 1 ? 'currency' : 'currencies'} configured
            </p>
          </div>
          <button
            onClick={() => setModal('new')}
            className="flex items-center gap-2 bg-primary-700 hover:bg-primary-800 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-colors"
          >
            <Plus size={14} /> Add Currency
          </button>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-4">
          <div className="grid grid-cols-1 md:grid-cols-[1fr_220px] gap-3">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by code, name, or symbol"
                className="w-full pl-9 pr-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div className="relative">
              <ArrowUpDown size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
              >
                <option value="base_first">Base First</option>
                <option value="code_asc">Code A-Z</option>
                <option value="code_desc">Code Z-A</option>
                <option value="rate_asc">Rate Low-High</option>
                <option value="rate_desc">Rate High-Low</option>
                <option value="updated_desc">Recently Updated</option>
                <option value="updated_asc">Oldest Updated</option>
              </select>
            </div>
          </div>
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
                <p className="text-sm font-bold text-gray-600">
                  No currencies yet
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Add your first currency to get started.
                </p>
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
                    {['Code', 'Name', 'Symbol', 'Rate', 'Last Updated', ''].map(
                      (h, i) => (
                        <th
                          key={i}
                          className="text-left text-[11px] font-bold text-gray-400 uppercase tracking-wide px-4 py-3 whitespace-nowrap"
                        >
                          {h}
                        </th>
                      ),
                    )}
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
                          <span className="font-mono font-bold text-gray-900 text-sm">
                            {cur.code}
                          </span>
                          {cur.isBaseCurrency && (
                            <span className="flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-full">
                              <Star
                                size={9}
                                className="fill-amber-400 text-amber-400"
                              />{' '}
                              Base
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="px-4 py-3 font-medium text-gray-700">
                        {cur.name}
                      </td>

                      <td className="px-4 py-3">
                        <span className="font-mono text-gray-500 bg-gray-50 border border-gray-100 px-2 py-0.5 rounded text-xs">
                          {cur.symbol}
                        </span>
                      </td>

                      <td className="px-4 py-3 font-mono text-gray-700">
                        {fmtRate(cur.rate)}
                      </td>

                      <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">
                        <span className="flex items-center gap-1.5">
                          <RefreshCw size={11} />
                          {fmtDate(cur.lastUpdated ?? cur.updatedAt)}
                        </span>
                      </td>

                      <td className="px-4 py-3 w-32">
                        {deleteId === cur.code ? (
                          <div className="flex items-center gap-1.5 text-xs">
                            <span className="text-red-600 font-semibold whitespace-nowrap">
                              Delete?
                            </span>
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
