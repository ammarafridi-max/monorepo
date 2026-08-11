'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Search, X } from 'lucide-react';

/**
 * Searchable country dropdown with flags.
 *
 * Same interaction as the v2 PhoneInput country selector — trigger button,
 * panel with a search box pinned to the top, scrollable filtered list — pulled
 * out so both can use it. Takes its options as a prop rather than owning a
 * country list, because the visa checker needs entries that are not countries
 * (the Schengen Area) alongside the ISO list.
 */

/**
 * Flags are emoji built from the ISO 3166-1 alpha-2 code: no image assets, no
 * network requests, and they inherit font size. `flagCode` lets an option
 * override it, which is how the Schengen Area borrows the EU flag despite
 * having no country code of its own.
 */
function Flag({ code, className = 'text-base' }) {
  const cc = String(code || '').toUpperCase();
  if (!/^[A-Z]{2}$/.test(cc)) return <span className={className}>🏳️</span>;
  const points = [...cc].map((c) => 0x1f1e6 - 65 + c.charCodeAt(0));
  return (
    <span className={`${className} leading-none`} aria-hidden="true">
      {String.fromCodePoint(...points)}
    </span>
  );
}

export default function CountryPicker({
  value,
  onChange,
  options = [],
  placeholder = 'Select country',
  label,
  hint,
  buttonClassName = '',
  align = 'left',
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const rootRef = useRef(null);
  const searchRef = useRef(null);

  const selected = options.find((o) => o.code === value) || null;

  const q = query.trim().toLowerCase();
  const filtered = q
    ? options.filter((o) => o.name.toLowerCase().includes(q) || o.code.toLowerCase() === q)
    : options;

  useEffect(() => {
    if (open) searchRef.current?.focus();
  }, [open]);

  useEffect(() => {
    function onClickOutside(e) {
      if (rootRef.current && !rootRef.current.contains(e.target)) {
        setOpen(false);
        setQuery('');
      }
    }
    function onEsc(e) {
      if (e.key === 'Escape') { setOpen(false); setQuery(''); }
    }
    document.addEventListener('mousedown', onClickOutside);
    document.addEventListener('keydown', onEsc);
    return () => {
      document.removeEventListener('mousedown', onClickOutside);
      document.removeEventListener('keydown', onEsc);
    };
  }, []);

  function pick(option) {
    onChange(option.code);
    setOpen(false);
    setQuery('');
  }

  return (
    <div className="relative w-full" ref={rootRef}>
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={`flex w-full items-center gap-2 text-left transition-colors focus:outline-none ${buttonClassName}`}
      >
        <span className="min-w-0 flex-1">
          {label && (
            <span className="block text-[11px] font-semibold uppercase tracking-wide text-gray-400">
              {label}
              {hint && <span className="ml-1 normal-case tracking-normal text-gray-300">{hint}</span>}
            </span>
          )}
          <span className="flex items-center gap-2">
            {selected ? <Flag code={selected.flagCode || selected.code} /> : null}
            <span className={`truncate text-sm ${selected ? 'font-medium text-gray-900' : 'text-gray-400'}`}>
              {selected ? selected.name : placeholder}
            </span>
          </span>
        </span>
        <ChevronDown
          size={14}
          className={`shrink-0 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div
          className={`absolute top-full z-50 mt-1.5 w-72 max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl ${
            align === 'right' ? 'right-0' : 'left-0'
          }`}
        >
          <div className="border-b border-gray-100 p-2">
            <div className="flex items-center gap-2 rounded-xl bg-gray-50 px-3 py-2">
              <Search size={13} className="shrink-0 text-gray-400" />
              <input
                ref={searchRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search country…"
                className="flex-1 bg-transparent text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none"
              />
              {query && (
                <button type="button" onClick={() => setQuery('')} aria-label="Clear search">
                  <X size={12} className="text-gray-400 hover:text-gray-600" />
                </button>
              )}
            </div>
          </div>

          <ul className="max-h-56 overflow-y-auto py-1" role="listbox">
            {filtered.length === 0 ? (
              <li className="px-4 py-3 text-center text-sm text-gray-400">No results</li>
            ) : (
              filtered.map((o) => (
                <li key={o.code}>
                  <button
                    type="button"
                    onClick={() => pick(o)}
                    role="option"
                    aria-selected={selected?.code === o.code}
                    className={`flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors ${
                      selected?.code === o.code
                        ? 'bg-primary-50 text-primary-700'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <Flag code={o.flagCode || o.code} />
                    <span className="flex-1 truncate">{o.name}</span>
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  );
}

export { Flag };
