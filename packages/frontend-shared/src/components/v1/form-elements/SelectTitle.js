'use client';

import { useRef, useState } from 'react';
import { useOutsideClick } from '../../../hooks/general/useOutsideClick';

export default function SelectTitle({ value, onChange, className = '' }) {
  const componentRef = useRef(null);
  const [showTitles, setShowTitles] = useState(false);

  const titles = [{ value: 'Mr.' }, { value: 'Mrs.' }, { value: 'Ms.' }];

  const handleSelect = title => {
    onChange({ target: { value: title } });
    setShowTitles(false);
  };

  useOutsideClick(componentRef, () => setShowTitles(false));

  return (
    <div className={`relative bg-white rounded-xl cursor-pointer ${className}`}>
      <div
        className="flex items-center text-sm text-gray-900 text-left px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500"
        onClick={() => setShowTitles(!showTitles)}
      >
        <span>{value}</span>
      </div>

      {showTitles && (
        <div
          className="absolute top-full left-0 w-24 mt-1.5 bg-white rounded-xl border border-gray-200 shadow-lg z-[1000] overflow-hidden"
          ref={componentRef}
        >
          {titles.map(title => (
            <div
              key={title.value}
              onClick={() => handleSelect(title.value)}
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
