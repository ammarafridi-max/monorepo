'use client';

import Link from 'next/link';
import { Pencil } from 'lucide-react';

export function ReviewSectionCard({
  title,
  editHref,
  titleClass = 'text-sm font-semibold text-gray-900',
  linkClass = 'text-xs font-medium',
  iconSize,
  children,
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
      <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
        <h2 className={titleClass}>{title}</h2>
        {editHref && (
          <Link
            href={editHref}
            className={`inline-flex items-center gap-1 ${linkClass} text-primary-700 hover:text-primary-900 transition-colors`}
          >
            {iconSize && <Pencil size={iconSize} strokeWidth={2.5} />}
            Edit
          </Link>
        )}
      </div>
      <div className="px-6 py-5">{children}</div>
    </div>
  );
}

export function ReviewRow({ label, value, weight = 'font-normal' }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-2 border-b border-gray-50 last:border-0">
      <span className={`text-xs text-gray-400 ${weight} shrink-0`}>{label}</span>
      <span className={`text-sm text-gray-900 ${weight} text-right`}>{value || '—'}</span>
    </div>
  );
}
