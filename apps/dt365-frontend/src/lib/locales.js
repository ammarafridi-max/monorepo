export const LOCALES = [
  { code: 'en-US', path: '', currency: 'USD' },
  { code: 'en-IN', path: '/in', currency: 'INR' },
  { code: 'en-CA', path: '/ca', currency: 'CAD' },
  { code: 'en-AE', path: '/ae', currency: 'AED' },
  { code: 'en-GB', path: '/uk', currency: 'GBP' },
  { code: 'en-SA', path: '/sa', currency: 'SAR' },
];

export function localeCurrency(pathname) {
  if (!pathname) return undefined;
  const hit = LOCALES.find(
    (l) => l.path && (pathname === l.path || pathname.startsWith(`${l.path}/`)),
  );
  return hit?.currency;
}

export const localePaths = () => LOCALES.filter((l) => l.path).map((l) => l.path);
