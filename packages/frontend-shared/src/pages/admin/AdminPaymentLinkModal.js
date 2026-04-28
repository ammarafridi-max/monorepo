'use client';

import { useState } from 'react';
import { Loader2, X } from 'lucide-react';

const CURRENCIES = [
  'AED', 'USD', 'EUR', 'GBP', 'SAR', 'INR', 'PKR',
  'CAD', 'AUD', 'CHF', 'JPY', 'SGD', 'HKD', 'NZD',
];

const inputCls =
  'w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 placeholder:text-gray-300 transition disabled:bg-gray-50 disabled:text-gray-400';

const EMPTY = {
  productName: '',
  amount: '',
  currency: 'AED',
  description: '',
};

export default function AdminPaymentLinkModal({ onClose, onSave, saving }) {
  const [form, setForm] = useState(EMPTY);

  function set(key, value) {
    setForm((p) => ({ ...p, [key]: value }));
  }

  const trimmedName = form.productName.trim();
  const amountNum = Number(form.amount);
  const canSave =
    trimmedName.length > 0 &&
    Number.isFinite(amountNum) &&
    amountNum > 0;

  function handleSave() {
    if (!canSave) return;
    onSave({
      productName: trimmedName,
      amount: amountNum,
      currency: form.currency.toLowerCase(),
      description: form.description.trim(),
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <p className="text-sm font-bold text-gray-900">New Payment Link</p>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition"
          >
            <X size={15} />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
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
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                Currency
              </label>
              <select
                value={form.currency}
                onChange={(e) => set('currency', e.target.value)}
                className={`${inputCls} font-mono`}
              >
                {CURRENCIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
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

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">
              Description
            </label>
            <input
              type="text"
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
              placeholder="e.g. Refund for delayed delivery"
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
