'use client';

import { useEffect } from 'react';
import { AlertCircle } from 'lucide-react';

export default function QuoteError({ error, reset }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-6">
      <div className="flex flex-col items-center text-center gap-5 max-w-sm">
        <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center">
          <AlertCircle size={26} className="text-red-400" />
        </div>
        <div>
          <p className="text-lg font-bold text-gray-900">Failed to load quotes</p>
          <p className="text-sm text-gray-400 mt-1">
            We couldn&apos;t fetch your insurance quotes. Please try again.
          </p>
        </div>
        <button
          onClick={reset}
          className="text-sm font-bold px-5 py-2.5 bg-primary-700 hover:bg-primary-800 text-white rounded-xl transition-colors"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
