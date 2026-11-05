const EMPTY = '—';

const LOCALE_DATE = 'en-GB';
const LOCALE_NUMBER = 'en-US';

const DMY = { day: '2-digit', month: 'short', year: 'numeric' };
const DMY_LOOSE = { day: 'numeric', month: 'short', year: 'numeric' };
const HM = { hour: '2-digit', minute: '2-digit' };
const TWO_DP = { minimumFractionDigits: 2, maximumFractionDigits: 2 };

export function fmtDate(value) {
  if (!value) return EMPTY;
  return new Date(value).toLocaleDateString(LOCALE_DATE, DMY);
}

export function fmtDateLoose(value) {
  if (!value) return EMPTY;
  return new Date(value).toLocaleDateString(LOCALE_DATE, DMY_LOOSE);
}

export function fmtDateLooseOrRaw(value) {
  if (!value) return EMPTY;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString(LOCALE_DATE, DMY_LOOSE);
}

export function fmtMonthYear(value) {
  if (!value) return EMPTY;
  return new Date(value).toLocaleDateString(LOCALE_DATE, { month: 'short', year: 'numeric' });
}

export function fmtDayMonthUTC(value) {
  if (!value) return '';
  const date = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString(LOCALE_DATE, { day: 'numeric', month: 'short', timeZone: 'UTC' });
}

export function fmtDatetime(value) {
  if (!value) return EMPTY;
  return new Date(value).toLocaleString(LOCALE_DATE, { ...DMY, ...HM });
}

export function fmtDatetimeUTC(value) {
  if (!value) return EMPTY;
  return `${new Date(value).toLocaleString(LOCALE_DATE, { ...DMY, ...HM, timeZone: 'UTC' })} UTC`;
}

export function fmtDatetimeOrNull(value) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleString(LOCALE_DATE, { ...DMY_LOOSE, ...HM });
}

export function fmtDayMonthTime(value) {
  if (!value) return '';
  return new Date(value).toLocaleString(LOCALE_DATE, { day: '2-digit', month: 'short', ...HM });
}

export function fmtTime(value) {
  if (!value) return '';
  return new Date(value).toLocaleTimeString(LOCALE_DATE, HM);
}

export function fmtTimeOrDate(value) {
  if (!value) return '';
  const date = new Date(value);
  const sameDay = date.toDateString() === new Date().toDateString();
  return sameDay
    ? date.toLocaleTimeString(LOCALE_DATE, HM)
    : date.toLocaleDateString(LOCALE_DATE, { day: '2-digit', month: 'short' });
}

export function fmtMoney(value, currency) {
  if (value == null) return EMPTY;
  const formatted = Number(value).toLocaleString(LOCALE_NUMBER, TWO_DP);
  return currency ? `${currency} ${formatted}` : formatted;
}

export function fmtMoneyUnguarded(amount, currency) {
  return `${currency ?? ''} ${Number(amount).toLocaleString(LOCALE_NUMBER, TWO_DP)}`.trim();
}

export function fmtRevenue(amount, currency) {
  return `${currency || ''} ${Number(amount || 0).toLocaleString(LOCALE_NUMBER, TWO_DP)}`.trim();
}

export function fmtMoneyCompact(value, currency = 'AED') {
  if (value == null) return EMPTY;
  return `${currency} ${Number(value).toLocaleString(LOCALE_NUMBER, { maximumFractionDigits: 2 })}`;
}

export function fmtAmountPaid(amountPaid) {
  if (!amountPaid?.amount) return EMPTY;
  return `${amountPaid.currency ?? ''} ${Number(amountPaid.amount).toLocaleString(LOCALE_NUMBER, { minimumFractionDigits: 2 })}`.trim();
}

export function fmtAmountPaidFixed(amountPaid, fallbackCurrency = 'AED') {
  if (!amountPaid?.amount) return EMPTY;
  return `${amountPaid.currency ?? fallbackCurrency} ${Number(amountPaid.amount).toLocaleString(LOCALE_NUMBER, TWO_DP)}`;
}

export function fmtInt(value) {
  return value == null ? EMPTY : Number(value).toLocaleString(LOCALE_NUMBER);
}

export function fmtPct(value) {
  return value == null ? EMPTY : `${(Number(value) * 100).toFixed(2)}%`;
}

export function fmtRate(value) {
  if (value == null) return EMPTY;
  return Number(value).toLocaleString(LOCALE_NUMBER, { minimumFractionDigits: 2, maximumFractionDigits: 6 });
}

function elapsedSeconds(value) {
  return Math.floor((Date.now() - new Date(value).getTime()) / 1000);
}

export function timeAgo(value, { empty = EMPTY, maxDays = Infinity, beyond = fmtDate } = {}) {
  if (!value) return empty;
  const secs = elapsedSeconds(value);
  if (secs < 60) return 'just now';
  if (secs < 3600) return `${Math.floor(secs / 60)}m ago`;
  if (secs < 86400) return `${Math.floor(secs / 3600)}h ago`;
  const days = Math.floor(secs / 86400);
  return days < maxDays ? `${days}d ago` : beyond(value);
}

export function timeAgoWordy(value, { empty = EMPTY, maxDays = 7, beyond = fmtDate } = {}) {
  if (!value) return empty;
  const secs = elapsedSeconds(value);
  if (secs < 60) return 'just now';
  if (secs < 3600) {
    const mins = Math.floor(secs / 60);
    return `${mins} minute${mins !== 1 ? 's' : ''} ago`;
  }
  if (secs < 86400) {
    const hours = Math.floor(secs / 3600);
    return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
  }
  const days = Math.floor(secs / 86400);
  if (days < maxDays) return `${days} day${days !== 1 ? 's' : ''} ago`;
  return beyond(value);
}

export function fmtDatetimeLong(value) {
  if (!value) return EMPTY;
  return new Date(value).toLocaleString(LOCALE_DATE, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

export function fmtTodayLong({ timeZone } = {}) {
  return new Date().toLocaleDateString(LOCALE_DATE, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    ...(timeZone ? { timeZone } : {}),
  });
}
