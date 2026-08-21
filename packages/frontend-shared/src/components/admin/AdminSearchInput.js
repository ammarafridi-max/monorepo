'use client';

import { Search, X } from 'lucide-react';

export default function AdminSearchInput({
  value,
  onChange,
  placeholder = 'Search…',
  className = '',
}) {
  return (
    <div className={`relative min-w-0 ${className}`}>
      <Search
        size={15}
        className="absolute left-1 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none"
      />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`w-full pl-7 ${value ? 'pr-7' : 'pr-2'} py-1.5 text-sm bg-transparent text-gray-900 border-0 rounded-none focus:outline-none placeholder:text-gray-500`}
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          aria-label="Clear search"
          className="absolute right-1 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-900"
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
}
