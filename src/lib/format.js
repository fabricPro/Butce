import { CURRENCIES } from '../constants.js';

export function formatNum(n, digits = 2) {
  return new Intl.NumberFormat('tr-TR', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(Math.abs(n));
}

export function formatMoney(n, currency = 'TRY', signed = false) {
  const sym = CURRENCIES[currency]?.symbol || '';
  const sign = signed
    ? (n < 0 ? '−' : n > 0 ? '+' : '')
    : (n < 0 ? '−' : '');
  if (currency === 'TRY') return `${sign}${formatNum(n)} ₺`;
  return `${sign}${sym}${formatNum(n)}`;
}

export function relativeTime(ts) {
  if (!ts) return '—';
  const diff = Date.now() - ts;
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'şimdi';
  if (m < 60) return `${m} dk önce`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} sa önce`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d} gün önce`;
  return new Date(ts).toLocaleDateString('tr-TR');
}

export function convertToTRY(amount, currency, fxRates) {
  if (currency === 'TRY') return amount;
  const rate = fxRates[currency] || 0;
  return amount * rate;
}
