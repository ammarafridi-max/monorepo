function pad2(value) {
  return String(value).padStart(2, '0');
}

export function isDateOnlyString(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(String(value || ''));
}

export function todayDateOnly() {
  const now = new Date();
  return `${now.getFullYear()}-${pad2(now.getMonth() + 1)}-${pad2(now.getDate())}`;
}

export function dateOnlyFromInput(input) {
  if (!input) return '';
  if (isDateOnlyString(input)) return String(input);

  const date = input instanceof Date ? input : new Date(input);
  if (Number.isNaN(date.getTime())) return '';

  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

export function compareDateOnly(a, b) {
  const left = dateOnlyFromInput(a);
  const right = dateOnlyFromInput(b);

  if (!left || !right) return 0;
  if (left < right) return -1;
  if (left > right) return 1;
  return 0;
}

export function dateOnlyToLocalDate(value) {
  const dateOnly = dateOnlyFromInput(value);
  if (!dateOnly) return null;

  const [year, month, day] = dateOnly.split('-').map(Number);
  return new Date(year, month - 1, day);
}
