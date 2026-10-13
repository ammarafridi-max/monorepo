'use client';

import { useEffect, useRef, useState } from 'react';
import { ChevronDown, Check, MapPin, Loader2 } from 'lucide-react';

export default function CitySelect({
  value,
  onChange,
  onSearch,
  inputClassName,
  inputId,
  inputRef: externalRef,
  placeholder = 'Search a city…',
  minChars = 2,
  debounceMs = 250,
}) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef(null);
  const internalRef = useRef(null);
  const inputRef = externalRef ?? internalRef;

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

  useEffect(() => {
    if (!open || query.trim().length < minChars) {
      setResults([]);
      return;
    }
    // Abort in flight so a slow early keystroke cannot overwrite a newer result.
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const found = await onSearch(query.trim(), { signal: controller.signal });
        if (!controller.signal.aborted) setResults(found ?? []);
      } catch {
        if (!controller.signal.aborted) setResults([]);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, debounceMs);

    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [query, open, minChars, debounceMs, onSearch]);

  function handleSelect(city) {
    onChange(city);
    setOpen(false);
    setQuery('');
    inputRef.current?.blur();
  }

  const displayValue = open ? query : (value?.label ?? '');
  const showEmpty = !loading && query.trim().length >= minChars && results.length === 0;

  return (
    <div className="relative" ref={containerRef}>
      <div className="relative">
        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
          <MapPin size={19} className="text-gray-500" />
        </span>
        <input
          ref={inputRef}
          id={inputId}
          type="text"
          placeholder={placeholder}
          value={displayValue}
          onFocus={() => { setQuery(''); setOpen(true); }}
          onChange={(e) => setQuery(e.target.value)}
          className={inputClassName}
          autoComplete="off"
        />
        {loading ? (
          <Loader2 size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 animate-spin" />
        ) : (
          <ChevronDown
            size={14}
            className={`absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none transition-transform ${open ? 'rotate-180' : ''}`}
          />
        )}
      </div>

      {open && (query.trim().length >= minChars || results.length > 0) && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg max-h-56 overflow-y-auto">
          {showEmpty ? (
            <p className="text-xs text-gray-400 px-4 py-3">No cities found for &quot;{query}&quot;</p>
          ) : (
            results.map((city) => {
              const isSelected = value?.name === city.name && value?.countryCode === city.countryCode;
              return (
                <button
                  key={`${city.name}-${city.countryCode}-${city.cityCode ?? ''}`}
                  type="button"
                  onClick={() => handleSelect(city)}
                  className={`w-full text-left px-4 py-2.5 text-sm flex items-center justify-between gap-2 hover:bg-primary-50 transition-colors ${
                    isSelected ? 'text-primary-700 font-semibold bg-primary-50/60' : 'text-gray-700'
                  }`}
                >
                  <span className="truncate">
                    {city.name}
                    <span className="text-gray-400 font-normal">, {city.countryCode}</span>
                  </span>
                  {isSelected && <Check size={13} className="text-primary-600 shrink-0" />}
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
