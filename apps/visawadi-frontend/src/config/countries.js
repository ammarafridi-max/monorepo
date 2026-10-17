export const COUNTRIES = [
  {
    slug: 'uae',
    code: 'AE',
    name: 'United Arab Emirates',
    short: 'UAE',
    residents: 'UAE residents',
    hub: 'Dubai',
    currency: 'AED',
    isLive: true,
  },
];

export const LIVE_COUNTRIES = COUNTRIES.filter((c) => c.isLive);

export const countryBySlug = (slug) => COUNTRIES.find((c) => c.slug === slug) || null;
export const countryByCode = (code) =>
  COUNTRIES.find((c) => c.code === String(code || '').toUpperCase()) || null;

export const DEFAULT_COUNTRY = LIVE_COUNTRIES[0] ?? COUNTRIES[0];
