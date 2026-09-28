import { SITE_URL } from './schema';

// hreflang needs every page in the cluster to list every other one, itself
// included, or Google drops the annotation.
export const LOCALES = [
  { code: 'en-US', path: '', currency: 'USD' },
  { code: 'en-IN', path: '/in', currency: 'INR' },
  { code: 'en-CA', path: '/ca', currency: 'CAD' },
  { code: 'en-AE', path: '/ae', currency: 'AED' },
  { code: 'en-GB', path: '/uk', currency: 'GBP' },
  { code: 'en-SA', path: '/sa', currency: 'SAR' },
];

export const hreflangAlternates = () => ({
  'x-default': SITE_URL,
  ...Object.fromEntries(LOCALES.map((l) => [l.code, `${SITE_URL}${l.path}`])),
});

// A locale variant exists to show local money, so it seeds the switcher.
export function localeCurrency(pathname) {
  if (!pathname) return undefined;
  const hit = LOCALES.find(
    (l) => l.path && (pathname === l.path || pathname.startsWith(`${l.path}/`)),
  );
  return hit?.currency;
}

export const localePaths = () => LOCALES.filter((l) => l.path).map((l) => l.path);
