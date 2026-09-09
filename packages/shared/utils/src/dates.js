/**
 * Calendar arithmetic in UTC. Everything here takes and returns a YYYY-MM-DD
 * string, so a caller can never reintroduce a local-timezone shift by passing
 * the result through a Date.
 */

const ISO_DAY = /^(\d{4})-(\d{2})-(\d{2})/;

/** The calendar day a value falls on in UTC, or null if it is not a date. */
export function toISODay(value) {
  if (!value) return null;
  if (typeof value === 'string') {
    const m = value.match(ISO_DAY);
    if (m) return `${m[1]}-${m[2]}-${m[3]}`;
  }
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString().slice(0, 10);
}

/** The same calendar day N years later. 29 February rolls into 1 March. */
export function addYears(value, years) {
  const day = toISODay(value);
  if (!day) return null;
  const [y, m, d] = day.split('-').map(Number);
  return new Date(Date.UTC(y + years, m - 1, d)).toISOString().slice(0, 10);
}

export function addDays(value, days) {
  const day = toISODay(value);
  if (!day) return null;
  const [y, m, d] = day.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
}

/**
 * The end of cover a multi-year journey type implies: the anniversary of the
 * start date minus one day, because WIS treats the period as inclusive of both
 * ends. Verified against the live quote endpoint — 2026-10-01 annual is
 * accepted as 2027-09-30 and rejected as 2027-10-01, and a leap day inside the
 * period shifts it, so this can never be a count of days.
 */
export function coverEndDate(journeyType, startDate, endDate) {
  const years = journeyType === 'annual' ? 1 : journeyType === 'biennial' ? 2 : 0;
  if (!years) return toISODay(endDate) ?? endDate;
  const day = toISODay(startDate);
  if (!day) return null;
  const [y, m, d] = day.split('-').map(Number);
  return new Date(Date.UTC(y + years, m - 1, d - 1)).toISOString().slice(0, 10);
}
