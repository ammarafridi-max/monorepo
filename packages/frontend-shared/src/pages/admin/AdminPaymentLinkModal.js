'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Check, ChevronDown, Loader2, Search, X } from 'lucide-react';
import { useProducts } from '../../hooks/payments/useProducts';

const CURRENCIES = [
  'AED', 'USD', 'EUR', 'GBP', 'SAR', 'INR', 'PKR',
  'CAD', 'AUD', 'CHF', 'JPY', 'SGD', 'HKD', 'NZD',
];

const inputCls =
  'w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 placeholder:text-gray-300 transition disabled:bg-gray-50 disabled:text-gray-400';

const EMPTY = {
  mode: 'product', // 'product' | 'custom'
  selected: [], // [{ productId, quantity }]
  productName: '',
  amount: '',
  currency: 'AED',
  description: '',
};

function formatMoney(amount, currency) {
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: (currency || 'AED').toUpperCase(),
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${(currency || '').toUpperCase()} ${Number(amount).toFixed(2)}`;
  }
}

export default function AdminPaymentLinkModal({ onClose, onSave, saving }) {
  const [form, setForm] = useState(EMPTY);
  const { products, isLoadingProducts } = useProducts({ activeOnly: true });

  function set(key, value) {
    setForm((p) => ({ ...p, [key]: value }));
  }

  const isProductMode = form.mode === 'product';

  // Resolve selected product IDs to full product objects (preserves selection order).
  const selectedDetailed = useMemo(() => {
    return form.selected
      .map((sel) => {
        const product = products.find((p) => p._id === sel.productId);
        return product ? { product, quantity: sel.quantity } : null;
      })
      .filter(Boolean);
  }, [form.selected, products]);

  // Currency check — Stripe requires all line items to share a currency.
  const selectedCurrencies = new Set(selectedDetailed.map((s) => s.product.currency));
  const currencyMismatch = selectedCurrencies.size > 1;

  const computedTotal = selectedDetailed.reduce(
    (sum, s) => sum + s.product.unitAmount * s.quantity,
    0,
  );
  const totalCurrency = selectedDetailed[0]?.product.currency || 'aed';

  const trimmedName = form.productName.trim();
  const amountNum = Number(form.amount);

  const canSave = isProductMode
    ? selectedDetailed.length > 0 && !currencyMismatch && computedTotal > 0
    : trimmedName.length > 0 && Number.isFinite(amountNum) && amountNum > 0;

  function handleSave() {
    if (!canSave) return;

    if (isProductMode) {
      onSave({
        items: selectedDetailed.map((s) => ({
          productId: s.product._id,
          quantity: s.quantity,
        })),
        description: form.description.trim(),
      });
    } else {
      onSave({
        productName: trimmedName,
        amount: amountNum,
        currency: form.currency.toLowerCase(),
        description: form.description.trim(),
      });
    }
  }

  function toggleProduct(productId) {
    setForm((p) => {
      const existing = p.selected.find((s) => s.productId === productId);
      const next = existing
        ? p.selected.filter((s) => s.productId !== productId)
        : [...p.selected, { productId, quantity: 1 }];
      return { ...p, selected: next };
    });
  }

  function setQuantity(productId, quantity) {
    setForm((p) => ({
      ...p,
      selected: p.selected.map((s) =>
        s.productId === productId
          ? { ...s, quantity: Math.max(1, Math.floor(Number(quantity) || 1)) }
          : s,
      ),
    }));
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <p className="text-sm font-bold text-gray-900">New Payment Link</p>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition"
          >
            <X size={15} />
          </button>
        </div>

        {/* Mode tabs */}
        <div className="px-6 pt-5">
          <div className="inline-flex rounded-xl border border-gray-200 bg-gray-50 p-0.5 text-xs font-semibold">
            <button
              type="button"
              onClick={() => set('mode', 'product')}
              className={`rounded-lg px-3 py-1.5 transition ${
                isProductMode ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              From products
            </button>
            <button
              type="button"
              onClick={() => set('mode', 'custom')}
              className={`rounded-lg px-3 py-1.5 transition ${
                !isProductMode ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              Custom amount
            </button>
          </div>
        </div>

        <div className="px-6 py-5 space-y-4 overflow-y-auto">
          {isProductMode ? (
            <ProductPickerSection
              products={products}
              isLoading={isLoadingProducts}
              selected={form.selected}
              onToggle={toggleProduct}
              onSetQuantity={setQuantity}
              currencyMismatch={currencyMismatch}
              total={computedTotal}
              totalCurrency={totalCurrency}
              detailed={selectedDetailed}
            />
          ) : (
            <>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                  Product / service name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.productName}
                  onChange={(e) => set('productName', e.target.value)}
                  placeholder="e.g. Schengen visa consultation"
                  maxLength={250}
                  className={inputCls}
                />
                <p className="text-[11px] text-gray-400 mt-1">
                  Shown to the customer on the Stripe checkout page.
                </p>
              </div>

              <div className="grid grid-cols-[120px_1fr] gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Currency</label>
                  <select
                    value={form.currency}
                    onChange={(e) => set('currency', e.target.value)}
                    className={`${inputCls} font-mono`}
                  >
                    {CURRENCIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                    Amount <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={form.amount}
                    onChange={(e) => set('amount', e.target.value)}
                    placeholder="0.00"
                    min="0.01"
                    step="0.01"
                    className={inputCls}
                  />
                </div>
              </div>
            </>
          )}

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">
              Description
            </label>
            <input
              type="text"
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
              placeholder="Internal note"
              className={inputCls}
            />
            <p className="text-[11px] text-gray-400 mt-1">
              Internal note. Visible only in the admin panel — not shown to the customer.
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-gray-100 bg-gray-50/60">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-xl transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!canSave || saving}
            className="flex items-center gap-2 px-4 py-2 text-xs font-bold bg-primary-700 hover:bg-primary-800 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl transition"
          >
            {saving && <Loader2 size={12} className="animate-spin" />}
            Create payment link
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Multi-select product picker ──────────────────────────────────────────────

function ProductPickerSection({
  products,
  isLoading,
  selected,
  onToggle,
  onSetQuantity,
  currencyMismatch,
  total,
  totalCurrency,
  detailed,
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const wrapperRef = useRef(null);

  // Close dropdown on outside click.
  useEffect(() => {
    if (!open) return;
    function onDown(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return products;
    return products.filter((p) =>
      p.name.toLowerCase().includes(q) ||
      (p.description || '').toLowerCase().includes(q),
    );
  }, [products, search]);

  if (isLoading) {
    return <p className="text-xs text-gray-400">Loading products…</p>;
  }
  if (products.length === 0) {
    return (
      <p className="text-xs text-gray-400">
        No active products yet. Create one in{' '}
        <a href="/admin/products" className="text-primary-700 underline">Products</a>.
      </p>
    );
  }

  const selectedIds = new Set(selected.map((s) => s.productId));

  return (
    <div className="space-y-3">
      <div>
        <label className="block text-xs font-semibold text-gray-600 mb-1.5">
          Products <span className="text-red-500">*</span>
        </label>

        {/* Trigger */}
        <div ref={wrapperRef} className="relative">
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            className={`${inputCls} flex items-center justify-between text-left`}
          >
            <span className={selected.length === 0 ? 'text-gray-400' : 'text-gray-800'}>
              {selected.length === 0
                ? 'Select products…'
                : `${selected.length} selected`}
            </span>
            <ChevronDown
              size={14}
              className={`shrink-0 text-gray-400 transition ${open ? 'rotate-180' : ''}`}
            />
          </button>

          {open && (
            <div className="absolute z-10 mt-1 w-full overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg">
              {/* Search */}
              <div className="border-b border-gray-100 p-2">
                <div className="relative">
                  <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    autoFocus
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search products…"
                    className="w-full rounded-lg border border-gray-200 bg-white py-1.5 pl-7 pr-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>

              {/* Options */}
              <div className="max-h-56 overflow-y-auto py-1">
                {filtered.length === 0 ? (
                  <p className="px-3 py-3 text-center text-xs text-gray-400">No matches</p>
                ) : (
                  filtered.map((p) => {
                    const isSelected = selectedIds.has(p._id);
                    return (
                      <button
                        type="button"
                        key={p._id}
                        onClick={() => onToggle(p._id)}
                        className={`flex w-full items-center justify-between gap-3 px-3 py-2 text-left transition hover:bg-gray-50 ${
                          isSelected ? 'bg-primary-50/50' : ''
                        }`}
                      >
                        <div className="flex min-w-0 items-center gap-2.5">
                          <span
                            className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-md border ${
                              isSelected
                                ? 'border-primary-700 bg-primary-700 text-white'
                                : 'border-gray-300 bg-white'
                            }`}
                          >
                            {isSelected && <Check size={10} strokeWidth={3} />}
                          </span>
                          <span className="truncate text-sm text-gray-800">{p.name}</span>
                        </div>
                        <span className="shrink-0 font-mono text-xs text-gray-500">
                          {formatMoney(p.unitAmount, p.currency)}
                        </span>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Selected items list */}
      {detailed.length > 0 && (
        <div className="space-y-2 rounded-xl border border-gray-100 bg-gray-50/60 p-3">
          {detailed.map(({ product, quantity }) => (
            <div
              key={product._id}
              className="flex items-center gap-3 rounded-lg bg-white px-3 py-2 shadow-sm"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-gray-900">{product.name}</p>
                <p className="text-[11px] text-gray-500">
                  {formatMoney(product.unitAmount, product.currency)} each
                </p>
              </div>
              <input
                type="number"
                value={quantity}
                onChange={(e) => onSetQuantity(product._id, e.target.value)}
                min="1"
                step="1"
                className="w-16 rounded-lg border border-gray-200 px-2 py-1 text-center text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <span className="w-24 shrink-0 text-right text-sm font-semibold text-gray-900">
                {formatMoney(product.unitAmount * quantity, product.currency)}
              </span>
              <button
                type="button"
                onClick={() => onToggle(product._id)}
                className="shrink-0 rounded-md p-1 text-gray-400 transition hover:bg-red-50 hover:text-red-600"
                title="Remove"
              >
                <X size={13} />
              </button>
            </div>
          ))}

          {currencyMismatch ? (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
              All selected products must share the same currency.
            </div>
          ) : (
            <div className="flex items-baseline justify-between border-t border-gray-200 pt-2 text-sm">
              <span className="text-gray-500">Total</span>
              <span className="font-bold text-gray-900">
                {formatMoney(total, totalCurrency)}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
