'use client';

import { useEffect } from 'react';
import { AlertCircle } from 'lucide-react';
import Link from 'next/link';

export default function SelectFlightsError({ error, reset }) {
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
          <p className="text-lg font-bold text-gray-900">Failed to load flights</p>
          <p className="text-sm text-gray-400 mt-1">
            We couldn&apos;t fetch available flights for your route. Please try again or adjust your search.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={reset}
            className="text-sm font-bold px-5 py-2.5 bg-primary-700 hover:bg-primary-800 text-white rounded-xl transition-colors"
          >
            Try again
          </button>
          <Link
            href="/"
            className="text-sm font-semibold text-gray-500 hover:text-gray-800 transition-colors"
          >
            Back to search
          </Link>
        </div>
      </div>
    </div>
  );
}
