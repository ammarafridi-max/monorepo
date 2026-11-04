import { COUNTRY_CURRENCY } from '../utils/geoCurrency.js';
import { COUNTRY_BY_CODE } from './countries.js';

const SHARED_CURRENCIES = {
  EUR: { label: 'European Union', flag: 'eu' },
  XOF: { label: 'West African CFA', flag: null },
  XAF: { label: 'Central African CFA', flag: null },
};

const PRIMARY_COUNTRY = {
  USD: 'US',
  CHF: 'CH',
};

const FIRST_COUNTRY = Object.entries(COUNTRY_CURRENCY).reduce((map, [country, currency]) => {
  if (!map[currency]) map[currency] = country;
  return map;
}, {});

export function currencyCountry(currencyCode) {
  const code = String(currencyCode ?? '').trim().toUpperCase();
  if (!code) return null;
  if (SHARED_CURRENCIES[code]) return SHARED_CURRENCIES[code];

  const country = PRIMARY_COUNTRY[code] ?? FIRST_COUNTRY[code];
  if (!country) return null;

  return { label: COUNTRY_BY_CODE[country] ?? country, flag: country.toLowerCase() };
}

export function flagUrl(flag) {
  if (!flag) return null;
  return `https://cdn.jsdelivr.net/gh/lipis/flag-icons@7.2.3/flags/4x3/${flag}.svg`;
}
