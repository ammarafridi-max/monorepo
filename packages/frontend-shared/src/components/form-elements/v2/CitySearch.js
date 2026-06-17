'use client';

import { useState, useRef, useEffect } from 'react';
import { MapPin, Loader2, ChevronDown } from 'lucide-react';
import { useCitySearch } from '../../../hooks/locations/useCitySearch.js';

// Resolve ISO-2 country codes to display names without bundling a country list.
const regionNames =
  typeof Intl !== 'undefined' && Intl.DisplayNames
    ? new Intl.DisplayNames(['en'], { type: 'region' })
    : null;

function countryName(code) {
  if (!code) return '';
  try {
    return regionNames?.of(String(code).toUpperCase()) || code;
  } catch {
    return code;
  }
}

/**
 * City autocomplete (AirLabs-backed). A selection commits both the city and its
 * country; the closed input shows "City - Country" (e.g. "Dubai - United Arab
 * Emirates"). `onChange` fires only on selection, with `{ city, country, countryCode }`.
 */
export default function CitySearch({ city = '', country = '', onChange, placeholder = 'Search city…', inputClassName }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const containerRef = useRef(null);
  const { cities, isLoadingCities } = useCitySearch(query);

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

  const inputCls =
    inputClassName ||
    'w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 transition';

  function handleSelect(c) {
    onChange?.({ city: c.name, country: countryName(c.countryCode), countryCode: c.countryCode });
    setOpen(false);
    setQuery('');
  }

  const committedLabel = city ? (country ? `${city} - ${country}` : city) : '';
  const displayValue = open ? query : committedLabel;

  return (
    <div className="relative" ref={containerRef}>
      <div className="relative">
        <input
          type="text"
          value={displayValue}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => {
            setOpen(true);
            setQuery('');
          }}
          placeholder={placeholder}
          autoComplete="off"
          className={`${inputCls} pl-9 pr-8`}
        />
        <MapPin size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none" />
        {isLoadingCities ? (
          <Loader2 size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 animate-spin" />
        ) : (
          <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none" />
        )}
      </div>

      {open && query.length >= 2 && cities.length > 0 && (
        <ul className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg max-h-56 overflow-y-auto">
          {cities.map((c, i) => (
            <li key={`${c.name}-${c.countryCode}-${i}`}>
              <button
                type="button"
                onClick={() => handleSelect(c)}
                className="w-full text-left px-4 py-2.5 text-sm flex items-center gap-2 hover:bg-primary-50 transition-colors"
              >
                <MapPin size={13} className="text-gray-300 shrink-0" />
                <span className="text-gray-800">{c.name}</span>
                {c.countryCode && (
                  <span className="text-gray-400 text-xs ml-auto">{countryName(c.countryCode)}</span>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
