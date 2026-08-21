'use client';

import Link from 'next/link';
import { Plus } from 'lucide-react';

const CLASSES =
  'fixed z-30 right-4 bottom-[calc(3.5rem+1rem+env(safe-area-inset-bottom))] lg:right-6 lg:bottom-6 w-14 h-14 rounded-full bg-primary-700 hover:bg-primary-800 text-white shadow-lg shadow-primary-900/20 flex items-center justify-center transition-colors active:scale-95';

export default function AdminFab({ href, onClick, label = 'Create', icon: Icon = Plus }) {
  if (href) {
    return (
      <Link href={href} aria-label={label} title={label} className={CLASSES}>
        <Icon size={24} />
      </Link>
    );
  }

  return (
    <button type="button" onClick={onClick} aria-label={label} title={label} className={CLASSES}>
      <Icon size={24} />
    </button>
  );
}
