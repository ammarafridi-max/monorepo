'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';

const BUTTON_CLS =
  'p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:border-primary-300 hover:text-primary-700 disabled:opacity-40 disabled:cursor-not-allowed transition';

export function Pagination({
  page,
  totalPages,
  total,
  onPageChange,
  hasPrev,
  hasNext,
  labelSize = 'text-sm',
  wrapperClass = 'flex items-center justify-between px-4 py-3 border-t border-gray-100',
}) {
  if (!(totalPages > 1)) return null;

  const prevDisabled = hasPrev === undefined ? page === 1 : !hasPrev;
  const nextDisabled = hasNext === undefined ? page === totalPages : !hasNext;

  return (
    <div className={wrapperClass}>
      <p className={`${labelSize} text-gray-400`}>
        Page {page} of {totalPages}
        {total == null ? '' : ` · ${total} total`}
      </p>
      <div className="flex items-center gap-2">
        <button disabled={prevDisabled} onClick={() => onPageChange(page - 1)} className={BUTTON_CLS}>
          <ChevronLeft size={14} />
        </button>
        <button disabled={nextDisabled} onClick={() => onPageChange(page + 1)} className={BUTTON_CLS}>
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
}
