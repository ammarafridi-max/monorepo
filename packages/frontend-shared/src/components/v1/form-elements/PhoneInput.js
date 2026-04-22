'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Search, X } from 'lucide-react';

const COUNTRIES = [
  { name: 'Afghanistan', code: 'AF', dial: '+93' },
  { name: 'Albania', code: 'AL', dial: '+355' },
  { name: 'Algeria', code: 'DZ', dial: '+213' },
  { name: 'Argentina', code: 'AR', dial: '+54' },
  { name: 'Australia', code: 'AU', dial: '+61' },
  { name: 'Austria', code: 'AT', dial: '+43' },
  { name: 'Bahrain', code: 'BH', dial: '+973' },
  { name: 'Bangladesh', code: 'BD', dial: '+880' },
  { name: 'Belgium', code: 'BE', dial: '+32' },
  { name: 'Brazil', code: 'BR', dial: '+55' },
  { name: 'Canada', code: 'CA', dial: '+1' },
  { name: 'China', code: 'CN', dial: '+86' },
  { name: 'Denmark', code: 'DK', dial: '+45' },
  { name: 'Egypt', code: 'EG', dial: '+20' },
  { name: 'Ethiopia', code: 'ET', dial: '+251' },
  { name: 'Finland', code: 'FI', dial: '+358' },
  { name: 'France', code: 'FR', dial: '+33' },
  { name: 'Germany', code: 'DE', dial: '+49' },
  { name: 'Ghana', code: 'GH', dial: '+233' },
  { name: 'Greece', code: 'GR', dial: '+30' },
  { name: 'Hong Kong', code: 'HK', dial: '+852' },
  { name: 'Hungary', code: 'HU', dial: '+36' },
  { name: 'India', code: 'IN', dial: '+91' },
  { name: 'Indonesia', code: 'ID', dial: '+62' },
  { name: 'Iran', code: 'IR', dial: '+98' },
  { name: 'Iraq', code: 'IQ', dial: '+964' },
  { name: 'Ireland', code: 'IE', dial: '+353' },
  { name: 'Israel', code: 'IL', dial: '+972' },
  { name: 'Italy', code: 'IT', dial: '+39' },
  { name: 'Japan', code: 'JP', dial: '+81' },
  { name: 'Jordan', code: 'JO', dial: '+962' },
  { name: 'Kenya', code: 'KE', dial: '+254' },
  { name: 'Kuwait', code: 'KW', dial: '+965' },
  { name: 'Lebanon', code: 'LB', dial: '+961' },
  { name: 'Libya', code: 'LY', dial: '+218' },
  { name: 'Malaysia', code: 'MY', dial: '+60' },
  { name: 'Mexico', code: 'MX', dial: '+52' },
  { name: 'Morocco', code: 'MA', dial: '+212' },
  { name: 'Netherlands', code: 'NL', dial: '+31' },
  { name: 'New Zealand', code: 'NZ', dial: '+64' },
  { name: 'Nigeria', code: 'NG', dial: '+234' },
  { name: 'Norway', code: 'NO', dial: '+47' },
  { name: 'Oman', code: 'OM', dial: '+968' },
  { name: 'Pakistan', code: 'PK', dial: '+92' },
  { name: 'Philippines', code: 'PH', dial: '+63' },
  { name: 'Poland', code: 'PL', dial: '+48' },
  { name: 'Portugal', code: 'PT', dial: '+351' },
  { name: 'Qatar', code: 'QA', dial: '+974' },
  { name: 'Romania', code: 'RO', dial: '+40' },
  { name: 'Russia', code: 'RU', dial: '+7' },
  { name: 'Saudi Arabia', code: 'SA', dial: '+966' },
  { name: 'Singapore', code: 'SG', dial: '+65' },
  { name: 'South Africa', code: 'ZA', dial: '+27' },
  { name: 'South Korea', code: 'KR', dial: '+82' },
  { name: 'Spain', code: 'ES', dial: '+34' },
  { name: 'Sri Lanka', code: 'LK', dial: '+94' },
  { name: 'Sudan', code: 'SD', dial: '+249' },
  { name: 'Sweden', code: 'SE', dial: '+46' },
  { name: 'Switzerland', code: 'CH', dial: '+41' },
  { name: 'Syria', code: 'SY', dial: '+963' },
  { name: 'Taiwan', code: 'TW', dial: '+886' },
  { name: 'Thailand', code: 'TH', dial: '+66' },
  { name: 'Tunisia', code: 'TN', dial: '+216' },
  { name: 'Turkey', code: 'TR', dial: '+90' },
  { name: 'Uganda', code: 'UG', dial: '+256' },
  { name: 'Ukraine', code: 'UA', dial: '+380' },
  { name: 'United Arab Emirates', code: 'AE', dial: '+971' },
  { name: 'United Kingdom', code: 'GB', dial: '+44' },
  { name: 'United States', code: 'US', dial: '+1' },
  { name: 'Venezuela', code: 'VE', dial: '+58' },
  { name: 'Vietnam', code: 'VN', dial: '+84' },
  { name: 'Yemen', code: 'YE', dial: '+967' },
];

function Flag({ code }) {
  const codePoints = [...code.toUpperCase()].map(
    (c) => 0x1f1e6 - 65 + c.charCodeAt(0),
  );
  return (
    <span className="text-base leading-none">
      {String.fromCodePoint(...codePoints)}
    </span>
  );
}

export default function PhoneInput({ value, onChange, required }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const dropdownRef = useRef(null);
  const searchRef = useRef(null);

  const selected =
    COUNTRIES.find((c) => c.dial === value?.code) ||
    COUNTRIES.find((c) => c.code === 'GB');

  const filtered = query.trim()
    ? COUNTRIES.filter(
        (c) =>
          c.name.toLowerCase().includes(query.toLowerCase()) ||
          c.dial.includes(query),
      )
    : COUNTRIES;

  function selectCountry(country) {
    onChange({ code: country.dial, digits: value?.digits ?? '' });
    setOpen(false);
    setQuery('');
  }

  function handleDigits(e) {
    onChange({ code: value?.code || selected.dial, digits: e.target.value });
  }

  useEffect(() => {
    if (!value?.code) {
      onChange({ code: selected.dial, digits: value?.digits ?? '' });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (open) searchRef.current?.focus();
  }, [open]);

  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
        setQuery('');
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="flex gap-0 relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        className="flex items-center gap-1.5 px-3 py-2.5 bg-white border border-gray-200 border-r-0 rounded-l-xl text-sm text-gray-700 hover:bg-gray-50 transition-colors shrink-0 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:z-10"
      >
        <Flag code={selected.code} />
        <span className="font-medium text-gray-600 text-xs">
          {selected.dial}
        </span>
        <ChevronDown
          size={12}
          className={`text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      <input
        type="tel"
        required={required}
        placeholder="50 123 4567"
        value={value?.digits ?? ''}
        onChange={handleDigits}
        className="flex-1 min-w-0 border border-gray-200 rounded-r-xl px-4 py-2.5 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:z-10 placeholder:text-gray-300"
      />

      {open && (
        <div className="absolute top-full left-0 mt-1.5 w-72 bg-white border border-gray-200 rounded-2xl shadow-xl z-50 overflow-hidden">
          <div className="p-2 border-b border-gray-100">
            <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2">
              <Search size={13} className="text-gray-400 shrink-0" />
              <input
                ref={searchRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search country or code…"
                className="flex-1 bg-transparent text-sm text-gray-700 focus:outline-none placeholder:text-gray-400"
              />
              {query && (
                <button type="button" onClick={() => setQuery('')}>
                  <X size={12} className="text-gray-400 hover:text-gray-600" />
                </button>
              )}
            </div>
          </div>

          <ul className="max-h-56 overflow-y-auto py-1">
            {filtered.length === 0 ? (
              <li className="px-4 py-3 text-sm text-gray-400 text-center">
                No results
              </li>
            ) : (
              filtered.map((country) => (
                <li key={country.code}>
                  <button
                    type="button"
                    onClick={() => selectCountry(country)}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left transition-colors ${
                      selected.code === country.code
                        ? 'bg-primary-50 text-primary-700'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <Flag code={country.code} />
                    <span className="flex-1 truncate">{country.name}</span>
                    <span className="text-xs text-gray-400 shrink-0 font-medium">
                      {country.dial}
                    </span>
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
