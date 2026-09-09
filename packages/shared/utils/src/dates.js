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

/**
 * The same calendar day N years later. 29 February clamps to 28 February
 * rather than rolling into March, which is what "one year from" means to an
 * insurer reading a policy period.
 */
export function addYears(value, years) {
  const day = toISODay(value);
  if (!day) return null;
  const [y, m, d] = day.split('-').map(Number);
  const target = Date.UTC(y + years, m - 1, d);
  const rolled = new Date(target).getUTCMonth() !== m - 1;
  return new Date(rolled ? Date.UTC(y + years, m, 0) : target).toISOString().slice(0, 10);
}

export function addDays(value, days) {
  const day = toISODay(value);
  if (!day) return null;
  const [y, m, d] = day.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
}

/**
 * The end of cover a multi-year journey type implies. WIS rejects a policy
 * whose end date is not exactly one or two calendar years from its start, so
 * this must never be approximated in days: 365 lands a day short whenever the
 * period contains a 29 February.
 */
export function coverEndDate(journeyType, startDate, endDate) {
  if (journeyType === 'annual') return addYears(startDate, 1);
  if (journeyType === 'biennial') return addYears(startDate, 2);
  return toISODay(endDate) ?? endDate;
}
