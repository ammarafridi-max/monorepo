// --- Date-only helpers --------------------------------------------------------

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

// --- Formatting ---------------------------------------------------------------

/** "January 1, 2025" */
export function formatDate(dateString) {
  if (!dateString) return '';
  const date = isDateOnlyString(dateString)
    ? dateOnlyToLocalDate(dateString)
    : new Date(dateOnlyFromInput(dateString) || dateString);
  if (!date || Number.isNaN(date.getTime())) return String(dateString);
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

/** "01 Jan, 2025" */
export function formatDateShort(inputDate) {
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const [year, month, day] = inputDate.split('-');
  return `${day} ${months[parseInt(month, 10) - 1]}, ${year}`;
}

/** { date: "January 1", time: "14:30" } from an ISO string */
export function formatISOTime(isoString) {
  const d = new Date(isoString);
  const monthNames = [
    'January','February','March','April','May','June',
    'July','August','September','October','November','December',
  ];
  return {
    date: `${monthNames[d.getMonth()]} ${d.getDate()}`,
    time: `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`,
  };
}

/** "2h 30m" from an ISO 8601 duration string */
export function formatISODuration(duration) {
  const match = duration.match(/PT(\d+H)?(\d+M)?/);
  if (!match) return 'Invalid duration format';
  const hours   = match[1] ? match[1].slice(0, -1) : '0';
  const minutes = match[2] ? match[2].slice(0, -1) : '0';
  return `${hours}h ${minutes}m`;
}

// --- Dubai timezone helpers ---------------------------------------------------

function toDubaiDate(dateInput) {
  return new Date(
    new Date(dateInput).toLocaleString('en-US', { timeZone: 'Asia/Dubai' }),
  );
}

export function convertToDubaiDate(dateInput, format = 'short') {
  if (!dateInput) return '—';
  const d = toDubaiDate(dateInput);
  if (Number.isNaN(d.getTime())) return '—';
  const day   = d.getDate();
  const month = d.toLocaleString('en-US', { month: format === 'long' ? 'long' : 'short' });
  const year  = d.getFullYear();
  return format === 'long' ? `${day} ${month}, ${year}` : `${day} ${month}`;
}

export function convertToDubaiTime(dateInput) {
  if (!dateInput) return '—';
  const d       = toDubaiDate(dateInput);
  if (Number.isNaN(d.getTime())) return '—';
  const hours24 = d.getHours();
  const hour12  = hours24 % 12 || 12;
  const amOrPm  = hours24 >= 12 ? 'PM' : 'AM';
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${hour12}:${minutes} ${amOrPm}`;
}

export function formatMongoDBDate(dateInput) {
  return `${convertToDubaiTime(dateInput)} (${convertToDubaiDate(dateInput, 'long')})`;
}
