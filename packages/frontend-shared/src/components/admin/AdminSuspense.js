'use client';

import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';

export function AdminSuspense({ children }) {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 size={24} className="animate-spin text-gray-300" />
        </div>
      }
    >
      {children}
    </Suspense>
  );
}
