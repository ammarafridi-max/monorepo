'use client';

import { useRef, useState } from 'react';
import { useOutsideClick } from '../../../hooks/general/useOutsideClick';

export default function SelectTitle({ value, onChange, className = '', placeholder = 'Title', ariaLabel = 'Title' }) {
  const componentRef = useRef(null);
  const [showTitles, setShowTitles] = useState(false);

  const titles = [{ value: 'Mr.' }, { value: 'Mrs.' }, { value: 'Ms.' }];

  const handleSelect = title => {
    onChange({ target: { value: title } });
    setShowTitles(false);
  };

  useOutsideClick(componentRef, () => setShowTitles(false));

  const isEmpty = !value;

  return (
    <div className={`relative bg-white rounded-xl cursor-pointer ${className}`}>
      <div
        role="button"
        tabIndex={0}
        aria-haspopup="listbox"
        aria-expanded={showTitles}
        aria-label={ariaLabel}
        className="flex items-center text-sm text-left px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500"
        onClick={() => setShowTitles(!showTitles)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setShowTitles((v) => !v);
          }
          if (e.key === 'Escape') setShowTitles(false);
        }}
      >
        <span className={isEmpty ? 'text-gray-400' : 'text-gray-900'}>
          {isEmpty ? placeholder : value}
        </span>
      </div>

      {showTitles && (
        <div
          role="listbox"
          className="absolute top-full left-0 w-24 mt-1.5 bg-white rounded-xl border border-gray-200 shadow-lg z-[1000] overflow-hidden"
          ref={componentRef}
        >
          {titles.map(title => (
            <div
              key={title.value}
              role="option"
              aria-selected={value === title.value}
              tabIndex={0}
              onClick={() => handleSelect(title.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleSelect(title.value);
                }
              }}
              className="px-4 py-2.5 text-sm text-gray-800 hover:bg-primary-50 hover:text-primary-700 transition-colors border-b last:border-b-0 border-gray-100 cursor-pointer"
            >
              {title.value}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
