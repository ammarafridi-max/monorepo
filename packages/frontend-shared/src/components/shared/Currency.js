'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { HiCheck, HiChevronDown, HiMagnifyingGlass, HiXMark } from 'react-icons/hi2';
import { useCurrency } from '../../contexts/CurrencyContext.js';
import { useOutsideClick } from '../../hooks/general/useOutsideClick.js';
import { currencyCountry, flagUrl } from '../../data/currencyCountries.js';

function Flag({ flag, size = 'md' }) {
  const url = flagUrl(flag);
  const box = size === 'sm' ? 'w-5 h-[15px]' : 'w-6 h-[18px]';
  if (!url) {
    return <span aria-hidden="true" className={`${box} shrink-0 rounded-[3px] bg-gray-200`} />;
  }
  return (
    <img
      src={url}
      alt=""
      aria-hidden="true"
      loading="lazy"
      className={`${box} shrink-0 rounded-[3px] object-cover ring-1 ring-black/10`}
    />
  );
}

const TRIGGER = {
  bare: ({ onDark }) =>
    `relative flex min-h-11 items-center gap-2 px-2 py-2 text-[13px] font-medium cursor-pointer transition-colors ${onDark ? 'text-white/85 hover:text-white' : 'text-gray-700 hover:text-gray-900'}`,
  bordered: () =>
    'relative flex items-center text-[12px] gap-2 border border-primary-200 bg-white hover:bg-primary-100 rounded-md px-3 py-1.5 cursor-pointer transition-colors',
};

export default function Currency({ onDark = false, className = '', variant = 'bare' }) {
  const { selectedCurrency, currencies, setCurrency } = useCurrency();
  const [open, setOpen] = useState(false);
  const [entered, setEntered] = useState(false);
  const [search, setSearch] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const wrapperRef = useRef(null);
  const searchRef = useRef(null);
  const listRef = useRef(null);

  useOutsideClick(wrapperRef, () => setOpen(false));

  const options = useMemo(() => {
    const decorated = (currencies ?? []).map((cur) => {
      const country = currencyCountry(cur.code);
      return { ...cur, country: country?.label ?? cur.name ?? cur.code, flag: country?.flag ?? null };
    });
    return decorated.sort(
      (a, b) => a.country.localeCompare(b.country) || a.code.localeCompare(b.code),
    );
  }, [currencies]);

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return options;
    return options.filter((cur) =>
      [cur.code, cur.country, cur.name].some((field) =>
        String(field ?? '').toLowerCase().includes(term),
      ),
    );
  }, [options, search]);

  useEffect(() => {
    if (!open) {
      setSearch('');
      setEntered(false);
      return;
    }
    const frame = requestAnimationFrame(() => setEntered(true));
    searchRef.current?.focus();
    return () => cancelAnimationFrame(frame);
  }, [open]);

  useEffect(() => {
    const selected = visible.findIndex((cur) => cur.code === selectedCurrency?.code);
    setActiveIndex(selected >= 0 ? selected : 0);
  }, [visible, selectedCurrency?.code]);

  useEffect(() => {
    if (!open) return;
    listRef.current
      ?.querySelector(`[data-index="${activeIndex}"]`)
      ?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex, open]);

  const choose = (code) => {
    setOpen(false);
    setCurrency(code);
  };

  const onKeyDown = (e) => {
    if (e.key === 'Escape') {
      setOpen(false);
      return;
    }
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      if (visible.length === 0) return;
      const step = e.key === 'ArrowDown' ? 1 : -1;
      setActiveIndex((i) => (i + step + visible.length) % visible.length);
      return;
    }
    if (e.key === 'Enter' && visible[activeIndex]) {
      e.preventDefault();
      choose(visible[activeIndex].code);
    }
  };

  if (!currencies?.length) return null;

  const selected = options.find((cur) => cur.code === selectedCurrency?.code);

  return (
    <div className={`relative ${className}`} ref={wrapperRef}>
      <button
        type="button"
        className={TRIGGER[variant]({ onDark })}
        onClick={() => setOpen((val) => !val)}
        aria-label="Select currency"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        {selected?.flag && <Flag flag={selected.flag} size="sm" />}
        <span>{selectedCurrency?.code || '...'}</span>
        <HiChevronDown
          aria-hidden="true"
          className={`transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div
          onKeyDown={onKeyDown}
          className={`absolute top-full right-0 mt-2 w-72 max-w-[calc(100vw-2rem)] origin-top-right rounded-2xl border border-gray-200 bg-white shadow-xl overflow-hidden z-100 transition duration-150 ease-out ${
            entered ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
          }`}
        >
          <div className="p-2.5 border-b border-gray-100">
            <div className="flex items-center gap-2 rounded-xl bg-gray-50 px-2.5 py-2 ring-1 ring-transparent transition focus-within:bg-white focus-within:ring-primary-500">
              <HiMagnifyingGlass aria-hidden="true" className="text-gray-400 shrink-0" />
              <input
                ref={searchRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search country or currency"
                aria-label="Search currencies"
                className="w-full bg-transparent text-[13px] text-gray-800 placeholder:text-gray-400 focus:outline-none"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => {
                    setSearch('');
                    searchRef.current?.focus();
                  }}
                  aria-label="Clear search"
                  className="shrink-0 rounded-full p-0.5 text-gray-400 hover:bg-gray-200 hover:text-gray-600 cursor-pointer transition-colors"
                >
                  <HiXMark />
                </button>
              )}
            </div>
          </div>

          <ul
            ref={listRef}
            role="listbox"
            aria-label="Currencies"
            className="max-h-80 overflow-y-auto p-2 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-200 hover:[&::-webkit-scrollbar-thumb]:bg-gray-300"
          >
            {visible.map((cur, index) => {
              const isSelected = selectedCurrency?.code === cur.code;
              const isActive = index === activeIndex;
              return (
                <li key={cur.code}>
                  <button
                    type="button"
                    role="option"
                    data-index={index}
                    aria-selected={isSelected}
                    onClick={() => choose(cur.code)}
                    className={`w-full flex items-center gap-3 rounded-xl px-2.5 py-2 text-sm text-left transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-primary-50 text-primary-700 font-semibold'
                        : `text-gray-700 hover:bg-gray-50 ${isActive ? 'bg-gray-50' : ''}`
                    }`}
                  >
                    <Flag flag={cur.flag} />
                    <span className="truncate">{cur.country}</span>
                    <span
                      className={`ml-auto shrink-0 text-xs font-semibold tracking-wide ${
                        isSelected ? 'text-primary-600' : 'text-gray-400'
                      }`}
                    >
                      {cur.code}
                    </span>
                    {isSelected && <HiCheck aria-hidden="true" className="shrink-0 text-primary-600" />}
                  </button>
                </li>
              );
            })}

            {visible.length === 0 && (
              <li className="flex flex-col items-center gap-1 px-3 py-6 text-center">
                <HiMagnifyingGlass aria-hidden="true" className="text-gray-300 text-lg" />
                <p className="text-sm font-medium text-gray-600">No match</p>
                <p className="text-xs text-gray-400">Try a country name or a currency code.</p>
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
