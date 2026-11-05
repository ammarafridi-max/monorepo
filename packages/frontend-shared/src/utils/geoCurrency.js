import { ZONE_COUNTRY, COUNTRY_CURRENCY } from '../data/geoTables.js';

export { COUNTRY_CURRENCY };

function resolvedTimeZone() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return undefined;
  }
}

function regionFromLanguageTag(tag) {
  const value = String(tag || '').trim();
  if (!value) return undefined;

  try {
    const region = new Intl.Locale(value).region;
    if (region) return region.toUpperCase();
  } catch {
    const parts = value.split(/[-_]/);
    const candidate = parts[parts.length - 1];
    if (/^[A-Za-z]{2}$/.test(candidate)) return candidate.toUpperCase();
  }

  return undefined;
}

export function countryForTimeZone(timeZone) {
  if (!timeZone) return undefined;
  return ZONE_COUNTRY[timeZone];
}

export function currencyForCountry(country) {
  if (!country) return undefined;
  return COUNTRY_CURRENCY[String(country).trim().toUpperCase()];
}

export function guessVisitorCountry() {
  if (typeof window === 'undefined') return undefined;

  const fromZone = countryForTimeZone(resolvedTimeZone());
  if (fromZone) return fromZone;

  const tags = Array.isArray(navigator.languages) && navigator.languages.length
    ? navigator.languages
    : [navigator.language];

  for (const tag of tags) {
    const region = regionFromLanguageTag(tag);
    if (region && COUNTRY_CURRENCY[region]) return region;
  }

  return undefined;
}

export function guessVisitorCurrency() {
  return currencyForCountry(guessVisitorCountry());
}
