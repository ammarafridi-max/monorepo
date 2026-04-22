'use client';

import { useState, useEffect, useRef } from 'react';
import { ChevronDown } from 'lucide-react';
import { useOutsideClick } from '../../../hooks/general/useOutsideClick';

export default function SearchableSelect({
  items = [],
  value = null,
  onChange,
  placeholder = 'Select an option…',
  minSearchLength = 0,
}) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef(null);

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

  function handleSelect(item) {
    setIsOpen(false);
    setQuery('');
    onChange(item);
  }

  function handleTriggerClick() {
    setIsOpen((prev) => !prev);
    setQuery('');
  }

  return (
    <div ref={ref} className="relative w-full">
      <button
        type="button"
        onClick={handleTriggerClick}
        className="w-full flex items-center justify-between gap-2 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors"
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
              className="w-full text-sm text-gray-800 placeholder:text-gray-400 px-3 py-2 bg-gray-50 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <ul className="max-h-64 overflow-y-auto divide-y divide-gray-50">
            {filteredItems.length === 0 && (
              <li className="px-4 py-3 text-sm text-gray-400">No results found</li>
            )}
            {filteredItems.map((item) => (
              <li
                key={item.id}
                onClick={() => handleSelect(item)}
                className={`px-4 py-3 cursor-pointer transition-colors hover:bg-primary-50 ${
                  value?.id === item.id ? 'bg-primary-50 text-primary-700' : 'text-gray-800'
                }`}
              >
                <div className="text-sm font-medium">{item.name}</div>
                {item.description && (
                  <div className="text-xs text-gray-400 mt-0.5">{item.description}</div>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
