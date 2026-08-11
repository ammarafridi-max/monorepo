/**
 * Countries VisaWadi serves, and the URL segment each one owns.
 *
 * Adding a country is: add it here, write its overlays in the admin, done. The
 * routes are generated from this list, so there is no second place to remember.
 *
 * `slug` is what people recognise rather than the ISO code — /uae and /ksa read
 * as addresses, /ae and /sa read as typos.
 */
export const COUNTRIES = [
  {
    slug: 'uae',
    code: 'AE',
    name: 'United Arab Emirates',
    short: 'UAE',
    /** How the audience is named in copy: "visa assistance for {residents}". */
    residents: 'UAE residents',
    /** Where applications are physically filed, for the hub page. */
    hub: 'Dubai',
    currency: 'AED',
    isLive: true,
  },
  // Next up. Add isLive: true once its overlays are written and reviewed.
  // { slug: 'ksa', code: 'SA', name: 'Saudi Arabia', short: 'KSA',
  //   residents: 'Saudi residents', hub: 'Riyadh', currency: 'SAR', isLive: false },
];

export const LIVE_COUNTRIES = COUNTRIES.filter((c) => c.isLive);

export const countryBySlug = (slug) => COUNTRIES.find((c) => c.slug === slug) || null;
export const countryByCode = (code) =>
  COUNTRIES.find((c) => c.code === String(code || '').toUpperCase()) || null;

/**
 * The country a visitor gets when they haven't chosen one — used by `/` and by
 * the checker's residence default. While only one country is live this is it;
 * once there are several, `/` becomes a chooser and this stays the fallback.
 */
export const DEFAULT_COUNTRY = LIVE_COUNTRIES[0] ?? COUNTRIES[0];
