'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

export default function NationalitySelect({ value, onChange, nationalities = [], inputClassName, required }) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);
  const inputRef = useRef(null);

  const filtered = nationalities.filter((n) =>
    n.nationality.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    function onClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
        setQuery('');
      }
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  function handleFocus() {
    setQuery('');
    setOpen(true);
  }

  function handleSelect(nat) {
    onChange(nat);
    setOpen(false);
    setQuery('');
    inputRef.current?.blur();
  }

  const displayValue = open ? query : (value?.nationality ?? '');

  return (
    <div className="relative" ref={containerRef}>
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          required={required}
          placeholder="Search nationality…"
          value={displayValue}
          onFocus={handleFocus}
          onChange={(e) => setQuery(e.target.value)}
          className={inputClassName}
          autoComplete="off"
        />
        <ChevronDown
          size={14}
          className={`absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </div>

      {open && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg max-h-56 overflow-y-auto">
          {filtered.length === 0 ? (
            <p className="text-xs text-gray-400 px-4 py-3">No results for "{query}"</p>
          ) : (
            filtered.map((nat) => (
              <button
                key={nat.id}
                type="button"
                onClick={() => handleSelect(nat)}
                className={`w-full text-left px-4 py-2.5 text-sm flex items-center justify-between gap-2 hover:bg-primary-50 transition-colors ${
                  value?.id === nat.id ? 'text-primary-700 font-semibold bg-primary-50/60' : 'text-gray-700'
                }`}
              >
                {nat.nationality}
                {value?.id === nat.id && <Check size={13} className="text-primary-600 shrink-0" />}
              </button>
            ))
          )}
        </div>
      )}

      {required && (
        <input
          tabIndex={-1}
          required
          value={value?.id ?? ''}
          onChange={() => {}}
          className="sr-only"
          aria-hidden="true"
        />
      )}
    </div>
  );
}
