'use client';

import { useState, useEffect, useRef, useId } from 'react';
import { ChevronDown } from 'lucide-react';
import { useOutsideClick } from '../../../hooks/general/useOutsideClick';

export default function SearchableSelect({
  items = [],
  value = null,
  onChange,
  placeholder = 'Select an option…',
  minSearchLength = 0,
  error,
  buttonRef,
  id,
}) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const ref = useRef(null);
  const listRef = useRef(null);
  const internalTriggerRef = useRef(null);
  const trigger = buttonRef ?? internalTriggerRef;
  const generatedId = useId();
  const fieldId = id || `select-${generatedId}`;
  const listboxId = `${fieldId}-listbox`;

  useOutsideClick(ref, () => {
    setIsOpen(false);
    setQuery('');
  });

  useEffect(() => {
    if (!isOpen) setQuery('');
  }, [isOpen]);

  const filteredItems =
    query.trim().length < minSearchLength
      ? items
      : items.filter((item) =>
          `${item.name} ${item.description ?? ''}`
            .toLowerCase()
            .includes(query.toLowerCase()),
        );

  useEffect(() => {
    if (!isOpen) {
      setActiveIndex(-1);
      return;
    }
    const selectedIndex = filteredItems.findIndex((item) => item.id === value?.id);
    setActiveIndex(filteredItems.length === 0 ? -1 : Math.max(selectedIndex, 0));
  }, [isOpen, query, items]);

  useEffect(() => {
    if (activeIndex < 0) return;
    const option = listRef.current?.querySelector(`[data-index="${activeIndex}"]`);
    option?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex]);

  function handleSelect(item) {
    setIsOpen(false);
    setQuery('');
    onChange(item);
    trigger.current?.focus();
  }

  function handleTriggerClick() {
    setIsOpen((prev) => !prev);
    setQuery('');
  }

  function handleKeyDown(e) {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      if (!isOpen) {
        setIsOpen(true);
        return;
      }
      if (filteredItems.length === 0) return;
      const step = e.key === 'ArrowDown' ? 1 : -1;
      setActiveIndex((prev) => {
        const next = prev + step;
        if (next < 0) return filteredItems.length - 1;
        if (next >= filteredItems.length) return 0;
        return next;
      });
      return;
    }

    if (e.key === 'Enter' && isOpen) {
      if (activeIndex >= 0 && filteredItems[activeIndex]) {
        e.preventDefault();
        handleSelect(filteredItems[activeIndex]);
      }
      return;
    }

    if (e.key === 'Escape' && isOpen) {
      e.preventDefault();
      setIsOpen(false);
      setQuery('');
      trigger.current?.focus();
    }
  }

  return (
    <div ref={ref} className="relative w-full" onKeyDown={handleKeyDown}>
      <button
        ref={trigger}
        id={fieldId}
        type="button"
        onClick={handleTriggerClick}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={isOpen ? listboxId : undefined}
        aria-invalid={error ? 'true' : undefined}
        className={`w-full flex items-center justify-between gap-2 ${
          error ? 'border border-red-600' : 'border border-gray-200'
        } rounded-xl px-4 py-3 text-sm text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors`}
      >
        <span className={value?.name ? 'text-gray-800' : 'text-gray-400'}>
          {value?.name || placeholder}
        </span>
        <ChevronDown
          size={15}
          className={`text-gray-400 shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 z-50 mt-1.5 w-full bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
          <div className="p-2 border-b border-gray-100">
            <input
              autoFocus
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search…"
              aria-controls={listboxId}
              aria-autocomplete="list"
              aria-activedescendant={
                activeIndex >= 0 ? `${fieldId}-option-${activeIndex}` : undefined
              }
              className="w-full text-sm text-gray-800 placeholder:text-gray-400 px-3 py-2 bg-gray-50 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <ul
            id={listboxId}
            role="listbox"
            ref={listRef}
            className="max-h-64 overflow-y-auto divide-y divide-gray-50"
          >
            {filteredItems.length === 0 && (
              <li className="px-4 py-3 text-sm text-gray-500">
                <span className="block font-medium text-gray-700">
                  No matches for &quot;{query.trim()}&quot;
                </span>
                <span className="block text-xs text-gray-400 mt-0.5">
                  Try a shorter search term.
                </span>
              </li>
            )}
            {filteredItems.map((item, index) => {
              const isSelected = value?.id === item.id;
              const isActive = index === activeIndex;
              return (
                <li
                  key={item.id}
                  id={`${fieldId}-option-${index}`}
                  role="option"
                  aria-selected={isSelected}
                  data-index={index}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => handleSelect(item)}
                  onMouseEnter={() => setActiveIndex(index)}
                  className={`px-4 py-3 cursor-pointer transition-colors ${
                    isActive ? 'bg-primary-50' : ''
                  } ${isSelected ? 'text-primary-700' : 'text-gray-800'}`}
                >
                  <div className="text-sm font-medium">{item.name}</div>
                  {item.description && (
                    <div className="text-xs text-gray-400 mt-0.5">{item.description}</div>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
