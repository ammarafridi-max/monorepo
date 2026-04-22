import { format } from 'date-fns';

const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

export function formatDate(d) {
  if (!d) return '—';
  try { return format(new Date(d), 'MMMM d, yyyy'); } catch { return String(d); }
}

export function formatDubaiTime(d) {
  if (!d) return '—';
  return new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Dubai',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).format(new Date(d));
}

// Expects "YYYY-MM-DD" — produces "1JAN"
export function formatToDDMMM(dateStr) {
  if (!dateStr) return '';
  const [, month, day] = String(dateStr).split('-');
  return `${Number(day)}${MONTHS[Number(month) - 1]}`;
}

// Expects "YYYY-MM-DD" — produces "1 JAN 2026"
export function formatToDDMMMYYYY(dateStr) {
  if (!dateStr) return '';
  const [year, month, day] = String(dateStr).split('-');
  return `${Number(day)} ${MONTHS[Number(month) - 1]} ${year}`;
}

// Extracts "DXB" from "Dubai International Airport (DXB)"
export function extractIataCode(locationString = '') {
  const start = String(locationString).indexOf('(') + 1;
  const end = String(locationString).indexOf(')');
  return start > 0 && end > start ? locationString.slice(start, end) : null;
}

// Normalises passenger type label from model values like "Adult (12+)", "Child (2-11)", "Infant (<2)"
export function paxType(t = '') {
  const s = String(t).toLowerCase();
  if (s.includes('child')) return 'Child';
  if (s.includes('infant')) return 'Infant';
  return 'Adult';
}
