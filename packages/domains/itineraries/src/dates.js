
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export function isValidDateString(value) {
  if (typeof value !== 'string' || !DATE_RE.test(value)) return false;
  const d = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return false;
  return toDateString(d) === value;
}

export function toDateString(date) {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  const d = String(date.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function toUTC(value) {
  return new Date(`${value}T00:00:00Z`);
}

export function inclusiveDayCount(startDate, endDate) {
  const start = toUTC(startDate);
  const end = toUTC(endDate);
  const ms = end.getTime() - start.getTime();
  return Math.floor(ms / 86_400_000) + 1;
}

export function addDays(startDate, offset) {
  const d = toUTC(startDate);
  d.setUTCDate(d.getUTCDate() + offset);
  return toDateString(d);
}

export function isWithinRange(date, startDate, endDate) {
  return date >= startDate && date <= endDate;
}

export function buildExpectedDates(startDate, dayCount) {
  return Array.from({ length: dayCount }, (_, i) => addDays(startDate, i));
}
