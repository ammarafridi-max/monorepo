'use client';

import { useState, useRef, useEffect } from 'react';
import { MapPin, Plane, Building2, X, Loader2 } from 'lucide-react';
import { useLocationSuggestions } from '@travel-suite/frontend-shared/hooks/locations/useLocationSuggestions';

const TYPE_ICONS = {
  airport:  Plane,
  hotel:    Building2,
  location: MapPin,
};

const defaultInputCls =
  'w-full rounded-xl border border-sand-300 bg-white px-4 py-3 pr-9 text-[15px] text-ink placeholder:text-ink-mute focus:border-clay-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-clay-500/20 transition-colors';

/**
 * LocationInput — combobox for picking a location from Google Places suggestions.
 *
 * Props
 *   value          { name, address, id, type } | null — controlled selected value
 *   onChange       (suggestion | null) => void
 *   placeholder    string
 *   inputClassName string — replaces the default input classes entirely
 */
export default function LocationInput({
  value,
  onChange,
  placeholder = 'Search location…',
  inputClassName,
}) {
  const [query, setQuery]           = useState(value?.name ?? '');
  const [open, setOpen]             = useState(false);
  const [highlighted, setHighlighted] = useState(-1);

  const containerRef = useRef(null);
  const inputRef     = useRef(null);
  const listRef      = useRef(null);
  const valueRef     = useRef(value);

  const { suggestions, isLoadingSuggestions } = useLocationSuggestions(query);

  // Keep valueRef current without re-subscribing effects
  useEffect(() => { valueRef.current = value; }, [value]);

  // When parent clears the value externally, clear the input text too
  useEffect(() => {
    if (!value) setQuery('');
  }, [value]);

  // Close on outside click; restore the committed text so the input isn't left dirty
  useEffect(() => {
    function handleOutsideClick(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
        setHighlighted(-1);
        setQuery(valueRef.current?.name ?? '');
      }
    }
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // Scroll the highlighted item into view when navigating by keyboard
  useEffect(() => {
    if (highlighted < 0 || !listRef.current) return;
    const item = listRef.current.children[highlighted];
    item?.scrollIntoView({ block: 'nearest' });
  }, [highlighted]);

  function handleInputChange(e) {
    const val = e.target.value;
    setQuery(val);
    setHighlighted(-1);
    setOpen(true);
    if (!val) onChange(null);
  }

  function handleSelect(suggestion) {
    setQuery(suggestion.name);
    setOpen(false);
    setHighlighted(-1);
    onChange(suggestion);
  }

  function handleClear(e) {
    e.preventDefault();
    setQuery('');
    setOpen(false);
    onChange(null);
    inputRef.current?.focus();
  }

  function handleKeyDown(e) {
    if (!open) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlighted((h) => Math.min(h + 1, suggestions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlighted((h) => Math.max(h - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const pick = highlighted >= 0 ? suggestions[highlighted] : suggestions[0];
      if (pick) handleSelect(pick);
    } else if (e.key === 'Escape') {
      setOpen(false);
      setHighlighted(-1);
      setQuery(valueRef.current?.name ?? '');
    }
  }

  const showDropdown = open && query.length >= 3;

  return (
    <div className="relative" ref={containerRef}>

      {/* ── Text input ─────────────────────────────────────────────────── */}
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={() => { if (query.length >= 3) setOpen(true); }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          autoComplete="off"
          spellCheck={false}
          className={inputClassName ?? defaultInputCls}
        />

        {/* Right adornment: spinner while loading, clear-X when there's text */}
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          {isLoadingSuggestions ? (
            <Loader2 size={15} className="animate-spin text-ink-mute" />
          ) : query ? (
            <button
              type="button"
              onMouseDown={handleClear}
              tabIndex={-1}
              className="text-ink-mute transition-colors hover:text-ink"
            >
              <X size={15} />
            </button>
          ) : null}
        </div>
      </div>

      {/* ── Dropdown ───────────────────────────────────────────────────── */}
      {showDropdown && (
        <ul
          ref={listRef}
          className="absolute left-0 right-0 z-50 mt-1.5 max-h-64 overflow-y-auto rounded-2xl border border-sand-200 bg-white shadow-warm"
        >
          {isLoadingSuggestions && suggestions.length === 0 ? (
            <li className="px-4 py-3 text-sm text-ink-mute">Searching…</li>
          ) : suggestions.length > 0 ? (
            suggestions.map((s, i) => {
              const Icon = TYPE_ICONS[s.type] ?? MapPin;
              return (
                <li
                  key={s.id}
                  className={i < suggestions.length - 1 ? 'border-b border-sand-100' : ''}
                >
                  <button
                    type="button"
                    onMouseDown={(e) => { e.preventDefault(); handleSelect(s); }}
                    className={[
                      'flex w-full items-start gap-3 px-4 py-3 text-left transition-colors',
                      i === highlighted ? 'bg-clay-50' : 'hover:bg-sand-50',
                    ].join(' ')}
                  >
                    <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-sand-100">
                      <Icon size={13} className="text-clay-600" />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-ink">{s.name}</p>
                      {s.address && (
                        <p className="truncate text-xs text-ink-mute">{s.address}</p>
                      )}
                    </div>
                  </button>
                </li>
              );
            })
          ) : (
            <li className="px-4 py-3 text-sm text-ink-mute">No results found.</li>
          )}
        </ul>
      )}

    </div>
  );
}
