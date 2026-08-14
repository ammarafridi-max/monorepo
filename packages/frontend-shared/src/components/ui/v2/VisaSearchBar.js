'use client';

import { Search, Loader2 } from 'lucide-react';
import CountryPicker from '../../form-elements/v2/CountryPicker.js';
import { COUNTRIES } from '../../../data/countries.js';


export const SCHENGEN_OPTION = {
  code: 'XS',
  name: 'Schengen Area',
  flagCode: 'EU',
};

export default function VisaSearchBar({
  nationality, setNationality,
  residence, setResidence,
  destination, setDestination,
  onSubmit,
  loading = false,
  error = '',
  stacked = false,
  extraDestinations = [SCHENGEN_OPTION],
}) {
  const destinations = [...extraDestinations, ...COUNTRIES];

  const segment = stacked
    ? 'w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 hover:border-gray-300'
    : 'h-full px-4 py-3 hover:bg-gray-50';

  if (stacked) {
    return (
      <form onSubmit={onSubmit}>
        <div className="flex flex-col gap-2.5">
          <CountryPicker
            label="Nationality" value={nationality} onChange={setNationality}
            options={COUNTRIES} placeholder="Your passport" buttonClassName={segment}
          />
          <CountryPicker
            label="You live in" hint="optional" value={residence} onChange={setResidence}
            options={COUNTRIES} placeholder="Country of residence" buttonClassName={segment}
          />
          <CountryPicker
            label="Going to" value={destination} onChange={setDestination}
            options={destinations} placeholder="Destination" buttonClassName={segment}
          />
        </div>

        {error && <p className="mt-2.5 text-xs font-medium text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-full bg-accent-500 px-5 py-3 text-sm font-semibold text-gray-900 transition-colors hover:bg-accent-600 disabled:opacity-60"
        >
          {loading ? <Loader2 size={15} className="animate-spin" /> : <Search size={15} />}
          {loading ? 'Checking' : 'Check now'}
        </button>
      </form>
    );
  }

  return (
    <form onSubmit={onSubmit}>
      <div className="flex flex-col gap-2 rounded-2xl border border-gray-200 bg-white p-2 shadow-[0_4px_20px_rgba(16,24,40,0.06)] md:flex-row md:items-stretch md:gap-0 md:rounded-full md:p-1.5">
        <div className="min-w-0 flex-1 rounded-xl md:rounded-full">
          <CountryPicker
            label="Nationality" value={nationality} onChange={setNationality}
            options={COUNTRIES} placeholder="Your passport" buttonClassName={`${segment} rounded-xl md:rounded-full`}
          />
        </div>

        <div className="hidden w-px shrink-0 self-center bg-gray-200 md:block md:h-8" />

        <div className="min-w-0 flex-1 rounded-xl md:rounded-full">
          <CountryPicker
            label="You live in" hint="optional" value={residence} onChange={setResidence}
            options={COUNTRIES} placeholder="Country of residence" buttonClassName={`${segment} rounded-xl md:rounded-full`}
          />
        </div>

        <div className="hidden w-px shrink-0 self-center bg-gray-200 md:block md:h-8" />

        <div className="min-w-0 flex-1 rounded-xl md:rounded-full">
          <CountryPicker
            label="Going to" value={destination} onChange={setDestination}
            options={destinations} placeholder="Destination"
            buttonClassName={`${segment} rounded-xl md:rounded-full`}
            align="right"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-accent-500 px-6 py-3 text-sm font-semibold text-gray-900 transition-colors hover:bg-accent-600 disabled:opacity-60 md:w-auto"
        >
          {loading ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
          <span className="md:hidden lg:inline">{loading ? 'Checking' : 'Check'}</span>
        </button>
      </div>

      {error && <p className="mt-3 text-sm font-medium text-red-600">{error}</p>}
    </form>
  );
}
