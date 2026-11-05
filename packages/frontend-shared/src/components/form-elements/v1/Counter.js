'use client';

import { Minus, Plus } from 'lucide-react';

export default function Counter({
  ageGroup,
  age,
  onAdd,
  onSubtract,
  value,
  min = 0,
  max,
  hint,
}) {
  const atMin = value <= min;
  const atMax = Number.isFinite(max) && value >= max;

  return (
    <div className="flex items-center justify-between gap-3">
      <div className="min-w-0">
        <p className="text-sm font-medium text-gray-700">
          {ageGroup}{' '}
          <span className="text-xs text-gray-400 font-normal">{age}</span>
        </p>
        {hint && <p className="text-xs text-gray-400 mt-0.5">{hint}</p>}
      </div>
      <div className="flex items-center gap-2 lg:gap-3 shrink-0">
        <button
          type="button"
          onClick={onSubtract}
          disabled={atMin}
          aria-label={`Remove one ${ageGroup}`}
          className="w-9 h-9 lg:w-7 lg:h-7 rounded-full border border-gray-300 flex items-center justify-center text-gray-500 hover:border-primary-500 hover:text-primary-600 active:bg-gray-100 transition-colors disabled:opacity-30 disabled:hover:border-gray-300 disabled:hover:text-gray-500"
        >
          <Minus size={14} aria-hidden="true" />
        </button>
        <span
          aria-live="polite"
          className="w-6 text-center text-sm font-semibold text-gray-900"
        >
          {value}
        </span>
        <button
          type="button"
          onClick={onAdd}
          disabled={atMax}
          aria-label={`Add one ${ageGroup}`}
          className="w-9 h-9 lg:w-7 lg:h-7 rounded-full border border-gray-300 flex items-center justify-center text-gray-500 hover:border-primary-500 hover:text-primary-600 active:bg-gray-100 transition-colors disabled:opacity-30 disabled:hover:border-gray-300 disabled:hover:text-gray-500"
        >
          <Plus size={14} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
