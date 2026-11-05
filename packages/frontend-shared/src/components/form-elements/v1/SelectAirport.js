'use client';

import { useState, useRef, useEffect, useId } from 'react';
import { Loader2 } from 'lucide-react';
import { useAirports } from '../../../hooks/airports/useAirports';
import { useOutsideClick } from '../../../hooks/general/useOutsideClick';
import { useDebounce } from '../../../hooks/general/useDebounce';
import { COUNTRY_BY_CODE } from '../../../data/countries.js';

export default function SelectAirport({ value, onChange, id, icon, error, inputRef }) {
  const [query, setQuery] = useState(value || '');
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const debouncedQuery = useDebounce(query, 250);
  const { airports, isFetchingAirports } = useAirports(isOpen ? debouncedQuery : '');
  const term = debouncedQuery.trim();
  const isSettling = query.trim() !== term;
  const isBusy = isSettling || isFetchingAirports;
  const containerRef = useRef();
  const listRef = useRef(null);
  const generatedId = useId();
  const fieldId = id || `airport-${generatedId}`;
  const listboxId = `${fieldId}-listbox`;

  useOutsideClick(containerRef, () => setIsOpen(false));

  useEffect(() => {
    if (typeof value === 'string' && value.length > 0 && !isOpen) setQuery(value);
  }, [value, isOpen]);

  useEffect(() => {
    setActiveIndex(airports.length > 0 ? 0 : -1);
  }, [airports]);

  useEffect(() => {
    if (activeIndex < 0) return;
    const option = listRef.current?.querySelector(`[data-index="${activeIndex}"]`);
    option?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex]);

  function handleChange(e) {
    setQuery(e.target.value);
    onChange(null);
    setIsOpen(true);
  }

  function handleSelect(airport) {
    const display = `${(airport.address.cityName || '').toUpperCase()} (${airport.iataCode})`;
    setQuery(display);
    setIsOpen(false);
    setActiveIndex(-1);
    onChange(display);
  }

  function handleClick() {
    if (typeof value === 'string' && value.length > 0) setQuery('');
    setIsOpen(true);
  }

  function handleKeyDown(e) {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      if (!isOpen) {
        setIsOpen(true);
        return;
      }
      if (airports.length === 0) return;
      const step = e.key === 'ArrowDown' ? 1 : -1;
      setActiveIndex((prev) => {
        const next = prev + step;
        if (next < 0) return airports.length - 1;
        if (next >= airports.length) return 0;
        return next;
      });
      return;
    }

    if (e.key === 'Enter') {
      if (isOpen && activeIndex >= 0 && airports[activeIndex]) {
        e.preventDefault();
        handleSelect(airports[activeIndex]);
      }
      return;
    }

    if (e.key === 'Escape' && isOpen) {
      e.preventDefault();
      setIsOpen(false);
      setActiveIndex(-1);
      return;
    }

    if (e.key === 'Tab' && isOpen) setIsOpen(false);
  }

  const showHelper = !isBusy && term.length < 3;
  const showEmpty = !isBusy && term.length >= 3 && airports.length === 0;

  return (
    <div className="relative w-full" ref={containerRef}>
      <div className="relative">
        <input
          id={fieldId}
          ref={inputRef}
          type="text"
          role="combobox"
          autoComplete="off"
          value={query}
          onChange={handleChange}
          onClick={handleClick}
          onFocus={handleClick}
          onKeyDown={handleKeyDown}
          placeholder="City, airport or code"
          aria-invalid={error ? 'true' : undefined}
          aria-expanded={isOpen}
          aria-controls={isOpen ? listboxId : undefined}
          aria-autocomplete="list"
          aria-activedescendant={
            isOpen && activeIndex >= 0 ? `${fieldId}-option-${activeIndex}` : undefined
          }
          className={`${error ? 'border border-red-600' : 'border border-gray-200'} rounded-xl px-4 py-2.5 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 w-full placeholder:text-gray-400 pr-10`}
        />
        <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-gray-400">
          {isBusy && isOpen ? <Loader2 size={17} className="animate-spin" /> : icon}
        </div>
      </div>

      {isOpen && (
        <div className="absolute z-50 mt-1.5 w-full bg-white border border-gray-200 rounded-2xl shadow-2xl overflow-hidden">
          <ul
            id={listboxId}
            role="listbox"
            ref={listRef}
            aria-label="Airport suggestions"
            className="max-h-72 overflow-y-auto py-1"
          >
            {isBusy && (
              <li className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-400">
                <Loader2 size={14} className="animate-spin" />
                Searching airports…
              </li>
            )}

            {showHelper && (
              <li className="px-4 py-2.5 text-sm text-gray-400">
                Keep typing — at least 3 characters
              </li>
            )}

            {showEmpty && (
              <li className="px-4 py-3 text-sm text-gray-500">
                <span className="block font-medium text-gray-700">
                  No airports match &quot;{term}&quot;
                </span>
                <span className="block text-xs text-gray-400 mt-0.5">
                  Try the city name or the 3 letter airport code.
                </span>
              </li>
            )}

            {!isBusy &&
              airports.map((airport, index) => {
                const country = COUNTRY_BY_CODE[airport.countryCode] || airport.countryCode;
                const isActive = index === activeIndex;
                return (
                  <li
                    key={airport.iataCode}
                    id={`${fieldId}-option-${index}`}
                    role="option"
                    aria-selected={isActive}
                    data-index={index}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => handleSelect(airport)}
                    onMouseEnter={() => setActiveIndex(index)}
                    className={`flex items-start gap-3 px-4 py-2.5 cursor-pointer transition-colors ${
                      isActive ? 'bg-primary-50' : ''
                    }`}
                  >
                    <span className="mt-0.5 shrink-0 rounded-md bg-gray-100 px-1.5 py-0.5 text-[11px] font-bold tracking-wide text-gray-600">
                      {airport.iataCode}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium text-gray-900 uppercase">
                        {airport.address.cityName}
                      </span>
                      <span className="block truncate text-xs text-gray-500">
                        {[airport.name, country].filter(Boolean).join(' · ')}
                      </span>
                    </span>
                  </li>
                );
              })}
          </ul>
        </div>
      )}
    </div>
  );
}
