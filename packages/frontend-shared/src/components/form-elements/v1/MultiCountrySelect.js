'use client';

import { useState, useRef } from 'react';
import { ChevronDown, X } from 'lucide-react';
import { useOutsideClick } from '../../../hooks/general/useOutsideClick';

// Searchable multi-select over a list of string options (e.g. countries).
// value/onChange work with an array of strings.
export default function MultiCountrySelect({
  value = [],
  onChange,
  options = [],
  placeholder = 'Add a country…',
}) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef(null);

  useOutsideClick(ref, () => {
    setIsOpen(false);
    setQuery('');
  });

  const selected = Array.isArray(value) ? value : [];
  const available = options.filter(
    (o) => !selected.includes(o) && o.toLowerCase().includes(query.toLowerCase()),
  );

  function add(country) {
    onChange([...selected, country]);
    setQuery('');
  }

  function remove(country) {
    onChange(selected.filter((c) => c !== country));
  }

  return (
    <div ref={ref} className="relative w-full">
      <div
        onClick={() => setIsOpen(true)}
        className="w-full min-h-[48px] flex flex-wrap items-center gap-2 border border-gray-200 rounded-xl px-3 py-2 bg-white focus-within:ring-2 focus-within:ring-primary-500 transition-colors cursor-text"
      >
        {selected.map((country) => (
          <span
            key={country}
            className="inline-flex items-center gap-1 bg-primary-50 text-primary-700 text-sm rounded-lg px-2.5 py-1"
          >
            {country}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                remove(country);
              }}
              className="text-primary-400 hover:text-primary-700"
              aria-label={`Remove ${country}`}
            >
              <X size={13} />
            </button>
          </span>
        ))}
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder={selected.length === 0 ? placeholder : ''}
          className="flex-1 min-w-[120px] text-sm text-gray-800 placeholder:text-gray-400 bg-transparent focus:outline-none py-1"
        />
        <ChevronDown
          size={15}
          className={`text-gray-400 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </div>

      {isOpen && available.length > 0 && (
        <ul className="absolute top-full left-0 z-50 mt-1.5 w-full bg-white border border-gray-200 rounded-xl shadow-lg max-h-56 overflow-y-auto divide-y divide-gray-50">
          {available.slice(0, 60).map((country) => (
            <li
              key={country}
              onClick={() => add(country)}
              className="px-4 py-2.5 text-sm text-gray-800 cursor-pointer hover:bg-primary-50 transition-colors"
            >
              {country}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
