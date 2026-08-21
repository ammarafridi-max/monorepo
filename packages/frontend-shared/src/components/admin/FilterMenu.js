'use client';

import { useEffect, useRef, useState } from 'react';
import { SlidersHorizontal, Check } from 'lucide-react';

export default function FilterMenu({ value, onChange, options = [], label = 'Filter', icon: Icon = SlidersHorizontal }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const close = (e) => { if (!ref.current?.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);

  const isFiltered = options.length > 0 && value !== options[0].value;

  return (
    <div ref={ref} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={label}
        aria-expanded={open}
        className="relative flex items-center text-gray-800 hover:text-black transition-colors"
      >
        <Icon size={18} />
        {isFiltered && (
          <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-primary-600" />
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 z-30 w-40 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden py-1">
          {options.map((option) => (
            <button
              key={option.value || 'all'}
              type="button"
              onClick={() => { onChange(option.value); setOpen(false); }}
              className={`w-full flex items-center justify-between gap-2 px-3 py-2 text-xs text-left hover:bg-gray-50 transition-colors ${
                option.value === value ? 'font-bold text-gray-900' : 'font-medium text-gray-600'
              }`}
            >
              {option.label}
              {option.value === value && <Check size={13} className="shrink-0 text-primary-600" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
