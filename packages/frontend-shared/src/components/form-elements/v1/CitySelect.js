'use client';

import { useEffect, useRef, useState, useId } from 'react';
import { useOutsideClick } from '../../../hooks/general/useOutsideClick';
import { ChevronDown, Check, MapPin, Loader2 } from 'lucide-react';
import { COUNTRY_BY_CODE } from '../../../data/countries.js';

export default function CitySelect({
  value,
  onChange,
  onSearch,
  inputClassName,
  inputId,
  inputRef: externalRef,
  placeholder = 'City or destination',
  minChars = 2,
  debounceMs = 250,
  error,
}) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const containerRef = useRef(null);
  const listRef = useRef(null);
  const internalRef = useRef(null);
  const inputRef = externalRef ?? internalRef;
  const generatedId = useId();
  const fieldId = inputId || `city-${generatedId}`;
  const listboxId = `${fieldId}-listbox`;

  useOutsideClick(containerRef, () => {
    setOpen(false);
    setIsTyping(false);
    setQuery('');
  });

  useEffect(() => {
    if (!open || query.trim().length < minChars) {
      setResults([]);
      setLoading(false);
      return;
    }
    const controller = new AbortController();
    setLoading(true);
    const timer = setTimeout(async () => {
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

  useEffect(() => {
    setActiveIndex(results.length > 0 ? 0 : -1);
  }, [results]);

  useEffect(() => {
    if (activeIndex < 0) return;
    const option = listRef.current?.querySelector(`[data-index="${activeIndex}"]`);
    option?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex]);

  function handleSelect(city) {
    onChange(city);
    setOpen(false);
    setIsTyping(false);
    setQuery('');
    setActiveIndex(-1);
  }

  function handleKeyDown(e) {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      if (!open) {
        setOpen(true);
        return;
      }
      if (results.length === 0) return;
      const step = e.key === 'ArrowDown' ? 1 : -1;
      setActiveIndex((prev) => {
        const next = prev + step;
        if (next < 0) return results.length - 1;
        if (next >= results.length) return 0;
        return next;
      });
      return;
    }

    if (e.key === 'Enter') {
      if (open && activeIndex >= 0 && results[activeIndex]) {
        e.preventDefault();
        handleSelect(results[activeIndex]);
      }
      return;
    }

    if (e.key === 'Escape' && open) {
      e.preventDefault();
      setOpen(false);
      setIsTyping(false);
      setQuery('');
      setActiveIndex(-1);
      return;
    }

    if (e.key === 'Tab' && open) setOpen(false);
  }

  const displayValue = isTyping ? query : (value?.label ?? '');
  const trimmed = query.trim();
  const showHelper = !loading && open && trimmed.length > 0 && trimmed.length < minChars;
  const showEmpty = !loading && trimmed.length >= minChars && results.length === 0;
  const isListOpen = open && (trimmed.length > 0 || results.length > 0);

  return (
    <div className="relative" ref={containerRef}>
      <div className="relative">
        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
          <MapPin size={19} className="text-gray-500" />
        </span>
        <input
          ref={inputRef}
          id={fieldId}
          type="text"
          role="combobox"
          placeholder={placeholder}
          value={displayValue}
          onFocus={() => setOpen(true)}
          onChange={(e) => { setIsTyping(true); setQuery(e.target.value); setOpen(true); }}
          onKeyDown={handleKeyDown}
          aria-invalid={error ? 'true' : undefined}
          aria-expanded={isListOpen}
          aria-controls={isListOpen ? listboxId : undefined}
          aria-autocomplete="list"
          aria-activedescendant={
            isListOpen && activeIndex >= 0 ? `${fieldId}-option-${activeIndex}` : undefined
          }
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

      {isListOpen && (
        <ul
          id={listboxId}
          role="listbox"
          ref={listRef}
          aria-label="City suggestions"
          className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg max-h-56 overflow-y-auto"
        >
          {loading && (
            <li className="flex items-center gap-2 px-4 py-3 text-xs text-gray-400">
              <Loader2 size={13} className="animate-spin" />
              Searching cities…
            </li>
          )}

          {showHelper && (
            <li className="px-4 py-3 text-xs text-gray-400">
              Keep typing — at least {minChars} characters
            </li>
          )}

          {showEmpty && (
            <li className="px-4 py-3 text-xs text-gray-500">
              <span className="block font-medium text-gray-700">
                No cities match &quot;{trimmed}&quot;
              </span>
              <span className="block text-gray-400 mt-0.5">Try a nearby or larger city.</span>
            </li>
          )}

          {!loading &&
            results.map((city, index) => {
              const isSelected =
                value?.name === city.name && value?.countryCode === city.countryCode;
              const isActive = index === activeIndex;
              const country = COUNTRY_BY_CODE[city.countryCode] || city.countryCode;
              return (
                <li
                  key={`${city.name}-${city.countryCode}-${city.cityCode ?? ''}`}
                  id={`${fieldId}-option-${index}`}
                  role="option"
                  aria-selected={isSelected}
                  data-index={index}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => handleSelect(city)}
                  onMouseEnter={() => setActiveIndex(index)}
                  className={`w-full cursor-pointer px-4 py-2.5 text-sm flex items-center justify-between gap-2 transition-colors ${
                    isActive ? 'bg-primary-50' : ''
                  } ${isSelected ? 'text-primary-700 font-semibold' : 'text-gray-700'}`}
                >
                  <span className="min-w-0">
                    <span className="block truncate">{city.name}</span>
                    <span className="block truncate text-xs font-normal text-gray-500">
                      {[country, city.cityCode].filter(Boolean).join(' · ')}
                    </span>
                  </span>
                  {isSelected && <Check size={13} className="text-primary-600 shrink-0" />}
                </li>
              );
            })}
        </ul>
      )}
    </div>
  );
}
