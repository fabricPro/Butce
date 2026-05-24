import { FX_FALLBACK, FX_TTL } from '../constants.js';

const FX_STORAGE_KEY = 'app:fx:cache';

export const INITIAL_FX = { rates: FX_FALLBACK, source: 'loading', fetchedAt: 0 };

// Local-storage shim wrappers (kept private to this module — fx is the only
// remaining client-side persisted state after the Supabase migration).
async function sGet(key) {
  try { return await window.storage.get(key); } catch { return null; }
}
async function sSet(key, value) {
  const v = typeof value === 'string' ? value : JSON.stringify(value);
  try { return await window.storage.set(key, v); } catch (e) { console.error('storage.set', key, e); return null; }
}

async function fetchFxRates() {
  const res = await fetch('https://api.frankfurter.app/latest?to=TRY,USD');
  if (!res.ok) throw new Error('fx http ' + res.status);
  const data = await res.json();
  const tryPerEur = data.rates?.TRY;
  const usdPerEur = data.rates?.USD;
  if (!tryPerEur || !usdPerEur) throw new Error('fx bad payload');
  return {
    TRY: 1,
    USD: tryPerEur / usdPerEur,
    EUR: tryPerEur,
  };
}

export async function ensureFxRates(forceRefresh = false) {
  const cached = await sGet(FX_STORAGE_KEY);
  const cache = cached?.value ? JSON.parse(cached.value) : null;
  const now = Date.now();
  if (!forceRefresh && cache && (now - cache.fetchedAt < FX_TTL)) return cache;
  try {
    const rates = await fetchFxRates();
    const fresh = {
      rates,
      source: 'frankfurter',
      fetchedAt: now,
      date: new Date().toISOString().slice(0, 10),
    };
    await sSet(FX_STORAGE_KEY, fresh);
    return fresh;
  } catch {
    if (cache) return { ...cache, source: cache.source + '_stale' };
    return { rates: FX_FALLBACK, source: 'fallback', fetchedAt: now };
  }
}

export async function saveManualRates(rates) {
  const fresh = {
    rates: { TRY: 1, USD: Number(rates.USD), EUR: Number(rates.EUR) },
    source: 'manual',
    fetchedAt: Date.now(),
    date: new Date().toISOString().slice(0, 10),
  };
  await sSet(FX_STORAGE_KEY, fresh);
  return fresh;
}
