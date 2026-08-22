'use client';

import { useEffect, useRef, useState } from 'react';
import { SlidersHorizontal, Check, ChevronDown } from 'lucide-react';

export default function FilterMenu({
  value,
  onChange,
  options = [],
  label = 'Filter',
  icon: Icon = SlidersHorizontal,
  variant = 'icon',
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const close = (e) => { if (!ref.current?.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);

  const isFiltered = options.length > 0 && value !== options[0].value;
  const current = options.find((o) => o.value === value) ?? options[0];

  return (
    <div ref={ref} className="relative shrink-0">
      {variant === 'text' ? (
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label={label}
          aria-expanded={open}
          className={`flex items-center gap-1 text-sm transition-colors ${
            isFiltered ? 'font-semibold text-gray-900' : 'font-medium text-gray-600 hover:text-gray-900'
          }`}
        >
          {current?.label}
          <ChevronDown size={14} className={`text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>
      ) : (
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
      )}

      {open && (
        <div className="absolute right-0 top-full mt-2 z-30 w-44 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden py-1">
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
