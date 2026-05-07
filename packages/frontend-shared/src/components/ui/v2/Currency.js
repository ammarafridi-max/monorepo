'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { useCurrency } from '../../../contexts/CurrencyContext.js';

export default function Currency({ className = 'hidden sm:block' }) {
  const { currencies = [], selectedCurrency: currency, setCurrency } = useCurrency();
  const [open, setOpen] = useState(false);

  return (
    <div className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        disabled={!currencies.length}
        className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
      >
        <span>{currency?.code ?? '...'}</span>
        <ChevronDown
          size={13}
          className={`text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-2 w-56 bg-white border border-gray-200 rounded-2xl shadow-xl overflow-hidden z-50">
            <div className="p-2 max-h-72 overflow-y-auto">
              {currencies.map((c) => (
                <button
                  key={c.code}
                  type="button"
                  onClick={() => { setCurrency(c); setOpen(false); }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors ${
                    currency?.code === c.code
                      ? 'bg-primary-50 text-primary-700 font-semibold'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <span className="font-medium">{c.code}</span>
                  <span className="text-gray-400 text-xs ml-auto">{c.name}</span>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
