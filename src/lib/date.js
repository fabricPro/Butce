import { AY_KISA, AYLAR } from '../constants.js';

export function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function daysInMonth(year, month0) {
  return new Date(year, month0 + 1, 0).getDate();
}

export function parseDate(s) {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function toDateStr(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function addDays(s, n) {
  const d = parseDate(s);
  d.setDate(d.getDate() + n);
  return toDateStr(d);
}

export function cmpDate(a, b) {
  return a.localeCompare(b);
}

export function formatDateShort(s) {
  const [, m, d] = s.split('-');
  return `${parseInt(d, 10)} ${AY_KISA[parseInt(m, 10) - 1]}`;
}

export function formatDateLong(s) {
  const d = parseDate(s);
  return `${d.getDate()} ${AY_KISA[d.getMonth()]} ${d.getFullYear()}`;
}

// Re-export Turkish month names for callers that need them inline.
export { AY_KISA, AYLAR };
