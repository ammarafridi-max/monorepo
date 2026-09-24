import { SITE_URL } from './schema';

// hreflang needs every page in the cluster to list every other one, itself
// included, or Google drops the annotation.
export const LOCALES = [
  { code: 'en-US', path: '', currency: 'USD' },
  { code: 'en-IN', path: '/in', currency: 'INR' },
];

export const hreflangAlternates = () => ({
  'x-default': SITE_URL,
  ...Object.fromEntries(LOCALES.map((l) => [l.code, `${SITE_URL}${l.path}`])),
});
