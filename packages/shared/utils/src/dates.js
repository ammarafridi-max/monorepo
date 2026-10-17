
const ISO_DAY = /^(\d{4})-(\d{2})-(\d{2})/;

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

export function coverEndDate(journeyType, startDate, endDate) {
  const years = journeyType === 'annual' ? 1 : journeyType === 'biennial' ? 2 : 0;
  if (!years) return toISODay(endDate) ?? endDate;
  const day = toISODay(startDate);
  if (!day) return null;
  const [y, m, d] = day.split('-').map(Number);
  return new Date(Date.UTC(y + years, m - 1, d - 1)).toISOString().slice(0, 10);
}
