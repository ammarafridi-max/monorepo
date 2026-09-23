'use client';

import { useMemo, useRef, useState } from 'react';
import { Search, Trash2, Upload } from 'lucide-react';
import PageLoader from '../../components/ui/v1/PageLoader';
import {
  useAirlines,
  useDeleteAirlineLogo,
  useUpdateAirlineLogo,
} from '../../hooks/flights/useAirlines';

const MAX_BYTES = 2 * 1024 * 1024;

// A logo is either a Cloudinary URL or a legacy backend-relative path.
function logoSrc(logo) {
  if (!logo) return '';
  if (/^https?:\/\//.test(logo)) return logo;
  return `${process.env.NEXT_PUBLIC_BACKEND_URL}${logo}`;
}

function AirlineRow({ airline, onUpload, onRemove, isBusy }) {
  const inputRef = useRef(null);
  const src = logoSrc(airline.logo);

  function handleFile(event) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (file.size > MAX_BYTES) {
      onUpload({ error: 'That image is over 2 MB. Please use a smaller file.' });
      return;
    }
    onUpload({ iataCode: airline.iataCode, file });
  }

  return (
    <tr className="border-t border-gray-100">
      <td className="px-4 py-3">
        <div className="flex h-10 w-14 items-center justify-center rounded border border-gray-200 bg-gray-50">
          {src ? (
            <img src={src} alt={airline.commonName || airline.iataCode} className="max-h-8 max-w-12 object-contain" />
          ) : (
            <span className="text-[10px] font-medium text-gray-400">None</span>
          )}
        </div>
      </td>
      <td className="px-4 py-3 font-mono text-sm font-semibold text-gray-900">{airline.iataCode}</td>
      <td className="px-4 py-3 text-sm text-gray-700">
        {airline.commonName || airline.businessName || '—'}
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center justify-end gap-2">
          <input ref={inputRef} type="file" accept="image/*" hidden onChange={handleFile} />
          <button
            type="button"
            disabled={isBusy}
            onClick={() => inputRef.current?.click()}
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-700 transition-colors hover:border-primary-300 hover:text-primary-700 disabled:opacity-50"
          >
            <Upload size={13} />
            {airline.logo ? 'Replace' : 'Upload'}
          </button>
          {airline.logo && (
            <button
              type="button"
              disabled={isBusy}
              onClick={() => onRemove(airline.iataCode)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-500 transition-colors hover:border-red-300 hover:text-red-600 disabled:opacity-50"
            >
              <Trash2 size={13} />
              Remove
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}

export default function AdminAirlineLogosPage({
  heading = 'Airline Logos',
  description = 'Logos are stored per airline and shown in flight search results. Upload a square PNG under 2 MB; it replaces the existing image immediately.',
}) {
  const { airlines, isLoadingAirlines, isErrorAirlines, airlinesError } = useAirlines();
  const { updateAirlineLogo, isUpdatingAirlineLogo } = useUpdateAirlineLogo();
  const { deleteAirlineLogo, isDeletingAirlineLogo } = useDeleteAirlineLogo();
  const [query, setQuery] = useState('');
  const [onlyMissing, setOnlyMissing] = useState(false);
  const [error, setError] = useState('');

  const isBusy = isUpdatingAirlineLogo || isDeletingAirlineLogo;

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return airlines.filter((a) => {
      if (onlyMissing && a.logo) return false;
      if (!needle) return true;
      return (
        a.iataCode?.toLowerCase().includes(needle) ||
        a.commonName?.toLowerCase().includes(needle) ||
        a.businessName?.toLowerCase().includes(needle)
      );
    });
  }, [airlines, query, onlyMissing]);

  const missingCount = useMemo(() => airlines.filter((a) => !a.logo).length, [airlines]);

  function handleUpload(payload) {
    if (payload.error) {
      setError(payload.error);
      return;
    }
    setError('');
    updateAirlineLogo(payload);
  }

  if (isLoadingAirlines) return <PageLoader />;

  if (isErrorAirlines) {
    return (
      <p className="mt-6 rounded-lg bg-white p-6 text-sm text-gray-700 shadow">
        {airlinesError?.message || 'Could not load airlines'}
      </p>
    );
  }

  return (
    <div className="mt-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-gray-900">{heading}</h2>
          <p className="mt-0.5 max-w-2xl text-sm text-gray-500">{description}</p>
        </div>
        <p className="shrink-0 text-sm text-gray-500">
          {airlines.length} airlines, {missingCount} without a logo
        </p>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by code or name"
            className="w-full rounded-lg border border-gray-200 py-2 pl-9 pr-3 text-sm focus:border-primary-400 focus:outline-none"
          />
        </div>
        <label className="flex items-center gap-2 text-sm text-gray-600">
          <input
            type="checkbox"
            checked={onlyMissing}
            onChange={(e) => setOnlyMissing(e.target.checked)}
            className="rounded border-gray-300"
          />
          Only missing a logo
        </label>
      </div>

      {error && (
        <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}

      <div className="mt-4 overflow-hidden rounded-xl border border-gray-200 bg-white">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="bg-gray-50">
              <th scope="col" className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-gray-500">Logo</th>
              <th scope="col" className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-gray-500">Code</th>
              <th scope="col" className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-gray-500">Airline</th>
              <th scope="col" className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {filtered.map((airline) => (
              <AirlineRow
                key={airline.iataCode}
                airline={airline}
                onUpload={handleUpload}
                onRemove={deleteAirlineLogo}
                isBusy={isBusy}
              />
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <p className="px-4 py-8 text-center text-sm text-gray-500">No airlines match that search.</p>
        )}
      </div>
    </div>
  );
}
