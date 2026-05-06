'use client';

import { Minus, Plus } from 'lucide-react';

export default function Counter({ ageGroup, age, onAdd, onSubtract, value }) {
  return (
    <div className="flex items-center justify-between">
      <p className="text-sm font-medium text-gray-700">
        {ageGroup}{' '}
        <span className="text-xs text-gray-400 font-normal">{age}</span>
      </p>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onSubtract}
          disabled={value === 0}
          className="w-7 h-7 rounded-full border border-gray-300 flex items-center justify-center text-gray-500 hover:border-primary-500 hover:text-primary-600 transition-colors disabled:opacity-30"
        >
          <Minus size={13} />
        </button>
        <span className="w-5 text-center text-sm font-semibold text-gray-900">
          {value}
        </span>
        <button
          type="button"
          onClick={onAdd}
          className="w-7 h-7 rounded-full border border-gray-300 flex items-center justify-center text-gray-500 hover:border-primary-500 hover:text-primary-600 transition-colors"
        >
          <Plus size={13} />
        </button>
      </div>
    </div>
  );
}
