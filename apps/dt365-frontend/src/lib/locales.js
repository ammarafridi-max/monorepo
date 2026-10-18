export const LOCALES = [
  { code: 'en-US', path: '', currency: 'USD' },
  { code: 'en-IN', path: '/in', currency: 'INR' },
  { code: 'en-CA', path: '/ca', currency: 'CAD' },
  { code: 'en-AE', path: '/ae', currency: 'AED' },
  { code: 'en-GB', path: '/uk', currency: 'GBP' },
  { code: 'en-SA', path: '/sa', currency: 'SAR' },
  { code: 'en-AU', path: '/au', currency: 'AUD' },
  { code: 'en-SG', path: '/sg', currency: 'SGD' },
  { code: 'en-PH', path: '/ph', currency: 'PHP' },
  { code: 'de-DE', path: '/de', currency: 'EUR' },
  { code: 'id-ID', path: '/id', currency: 'IDR' },
];

export function localeCurrency(pathname) {
  if (!pathname) return undefined;
  const hit = LOCALES.find(
    (l) => l.path && (pathname === l.path || pathname.startsWith(`${l.path}/`)),
  );
  return hit?.currency;
}

export const localePaths = () => LOCALES.filter((l) => l.path).map((l) => l.path);
