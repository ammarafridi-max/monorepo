import { Loader2, X } from 'lucide-react';
import { useState } from 'react';

const EMPTY = {
  code: '',
  name: '',
  symbol: '',
  rate: '',
  isBaseCurrency: false,
};

const inputCls =
  'w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 placeholder:text-gray-300 transition disabled:bg-gray-50 disabled:text-gray-400';

export default function CurrencyModal({ initial, onClose, onSave, saving }) {
  const isEdit = !!initial;
  const [form, setForm] = useState(
    initial
      ? {
          code: initial.code,
          name: initial.name,
          symbol: initial.symbol,
          rate: String(initial.rate),
          isBaseCurrency: !!initial.isBaseCurrency,
        }
      : EMPTY,
  );

  function set(key, value) {
    setForm((p) => {
      const next = { ...p, [key]: value };

      if (key === 'isBaseCurrency' && value) {
        next.rate = '1';
      }

      return next;
    });
  }

  const canSave =
    form.code.trim() &&
    form.name.trim() &&
    form.symbol.trim() &&
    form.rate !== '';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <p className="text-sm font-bold text-gray-900">
            {isEdit ? 'Edit Currency' : 'New Currency'}
          </p>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition"
          >
            <X size={15} />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                Code <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.code}
                onChange={(e) => set('code', e.target.value.toUpperCase())}
                placeholder="USD"
                maxLength={10}
                disabled={isEdit}
                className={`${inputCls} font-mono uppercase`}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                Symbol <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.symbol}
                onChange={(e) => set('symbol', e.target.value)}
                placeholder="$"
                maxLength={5}
                className={inputCls}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">
              Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => set('name', e.target.value)}
              placeholder="US Dollar"
              className={inputCls}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">
              Exchange Rate <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              value={form.rate}
              onChange={(e) => set('rate', e.target.value)}
              placeholder="1.00"
              min="0"
              step="any"
              disabled={form.isBaseCurrency}
              className={inputCls}
            />
            <p className="text-[11px] text-gray-400 mt-1">
              {form.isBaseCurrency ? 'Base currency is always fixed to 1.00.' : 'Rate relative to the base currency.'}
            </p>
          </div>

          <label className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:bg-gray-50 cursor-pointer transition">
            <input
              type="checkbox"
              checked={form.isBaseCurrency}
              onChange={(e) => set('isBaseCurrency', e.target.checked)}
              className="w-4 h-4 rounded accent-primary-700"
            />
            <div>
              <p className="text-xs font-semibold text-gray-700">
                Base currency
              </p>
              <p className="text-[11px] text-gray-400">
                Only one currency can be the base (rate = 1).
              </p>
            </div>
          </label>
        </div>

        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-gray-100 bg-gray-50/60">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-xl transition"
          >
            Cancel
          </button>
          <button
            onClick={() => onSave(form)}
            disabled={!canSave || saving}
            className="flex items-center gap-2 px-4 py-2 text-xs font-bold bg-primary-700 hover:bg-primary-800 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl transition"
          >
            {saving && <Loader2 size={12} className="animate-spin" />}
            {isEdit ? 'Save Changes' : 'Create Currency'}
          </button>
        </div>
      </div>
    </div>
  );
}
