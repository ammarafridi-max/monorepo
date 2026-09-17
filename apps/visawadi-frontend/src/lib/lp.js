/**
 * Vocabulary for the /lp ad landing pages, which must not carry the word
 * "visa" anywhere, brand name included. Change these two and every /lp page
 * follows.
 */
export const LP_BRAND = 'Wadi';
export const LP_TERM = 'permit';

const BRAND_RE = /visa\s?wadi/gi;
const TERM_RE = /visa/gi;

function matchCase(source, replacement) {
  if (source === source.toUpperCase()) return replacement.toUpperCase();
  if (source[0] === source[0].toUpperCase()) return replacement[0].toUpperCase() + replacement.slice(1);
  return replacement;
}

// Image and link URLs are left alone: rewriting a Cloudinary path breaks the
// image, and the folder name is not reader-facing text.
const isUrl = (s) => /^(https?:\/\/|\/)\S*$/.test(s);

export function scrubText(value) {
  if (typeof value !== 'string' || isUrl(value)) return value;
  return value.replace(BRAND_RE, LP_BRAND).replace(TERM_RE, (m) => matchCase(m, LP_TERM));
}

/** Walks any JSON-shaped value and scrubs every string in it. */
export function scrubDeep(value) {
  if (typeof value === 'string') return scrubText(value);
  if (Array.isArray(value)) return value.map(scrubDeep);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, scrubDeep(v)]));
  }
  return value;
}
