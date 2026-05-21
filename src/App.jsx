import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine } from 'recharts';
import {
  Plus, ShoppingCart, Car, Home, Coffee, Zap, Film, Shirt, BookOpen, MoreHorizontal,
  Briefcase, Gift, TrendingUp, TrendingDown, Trash2, X, ChevronLeft, ChevronRight,
  ArrowUpRight, ArrowDownRight, Wallet, Landmark, CreditCard, Pencil,
  RefreshCw, Globe, AlertTriangle, Check, ArrowLeftRight,
  Repeat, Calendar, PauseCircle, PlayCircle, Info, Layers, Activity, Target
} from 'lucide-react';

/* ============================================================
   CONSTANTS
   ============================================================ */

const CURRENCIES = {
  TRY: { code: 'TRY', symbol: '₺', label: 'Türk Lirası' },
  USD: { code: 'USD', symbol: '$', label: 'Amerikan Doları' },
  EUR: { code: 'EUR', symbol: '€', label: 'Euro' },
};
const CURRENCY_LIST = ['TRY', 'USD', 'EUR'];

const ACCOUNT_TYPES = {
  nakit: { label: 'Nakit', Icon: Wallet },
  banka: { label: 'Banka', Icon: Landmark },
  kredi_karti: { label: 'Kredi Kartı', Icon: CreditCard },
};

const ACCOUNT_COLORS = ['#D4A574', '#A8C886', '#DC8A6E', '#7FB3D5', '#B58968', '#C9B89F', '#9A8FBE', '#E0A98B'];

const CATS = {
  gelir: [
    { id: 'maas', label: 'Maaş', Icon: Briefcase },
    { id: 'ek_gelir', label: 'Ek Gelir', Icon: Gift },
    { id: 'yatirim', label: 'Yatırım', Icon: TrendingUp },
    { id: 'diger_g', label: 'Diğer', Icon: MoreHorizontal },
  ],
  gider: [
    { id: 'market', label: 'Market', Icon: ShoppingCart },
    { id: 'yemek', label: 'Yemek', Icon: Coffee },
    { id: 'ulasim', label: 'Ulaşım', Icon: Car },
    { id: 'fatura', label: 'Fatura', Icon: Zap },
    { id: 'kira', label: 'Kira', Icon: Home },
    { id: 'eglence', label: 'Eğlence', Icon: Film },
    { id: 'giyim', label: 'Giyim', Icon: Shirt },
    { id: 'egitim', label: 'Eğitim', Icon: BookOpen },
    { id: 'diger', label: 'Diğer', Icon: MoreHorizontal },
  ],
};

const AYLAR = ['Ocak','Şubat','Mart','Nisan','Mayıs','Haziran','Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık'];
const AY_KISA = AYLAR.map(a => a.slice(0,3));
const PIE_COLORS = ['#DC8A6E','#D4A574','#C9966F','#E0A98B','#B58968','#CC9772','#A87559','#BF8E5E','#8E7560'];

/* ============================================================
   STORAGE
   ============================================================ */

const STORAGE_KEYS = {
  schemaVersion: 'app:schema:version',
  accounts: 'app:accounts:list',
  transactions: 'app:transactions:list',
  recurring: 'app:recurring:list',
  budgetGoals: 'app:budget:goals',
  fx: 'app:fx:cache',
  legacy: 'butce:transactions',
};

const FREQUENCIES = {
  aylik: { label: 'Aylık', short: 'ay' },
  haftalik: { label: 'Haftalık', short: 'hf' },
  yillik: { label: 'Yıllık', short: 'yıl' },
};

const WEEKDAYS = [
  { id: 1, label: 'Pzt', full: 'Pazartesi' },
  { id: 2, label: 'Sal', full: 'Salı' },
  { id: 3, label: 'Çar', full: 'Çarşamba' },
  { id: 4, label: 'Per', full: 'Perşembe' },
  { id: 5, label: 'Cum', full: 'Cuma' },
  { id: 6, label: 'Cmt', full: 'Cumartesi' },
  { id: 0, label: 'Paz', full: 'Pazar' },
];

async function sGet(key) {
  try { return await window.storage.get(key); } catch { return null; }
}
async function sSet(key, value) {
  const v = typeof value === 'string' ? value : JSON.stringify(value);
  try { return await window.storage.set(key, v); } catch (e) { console.error('storage.set', key, e); return null; }
}
async function sDel(key) {
  try { return await window.storage.delete(key); } catch { return null; }
}

async function loadList(key) {
  const r = await sGet(key);
  if (r?.value) { try { return JSON.parse(r.value); } catch { return []; } }
  return [];
}

/* ============================================================
   FX SERVICE  (Frankfurter, EUR base)
   ============================================================ */

const FX_TTL = 24 * 60 * 60 * 1000;
const FX_FALLBACK = { TRY: 1, USD: 32.5, EUR: 35.2 };

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

async function ensureFxRates(forceRefresh = false) {
  const cached = await sGet(STORAGE_KEYS.fx);
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
    await sSet(STORAGE_KEYS.fx, fresh);
    return fresh;
  } catch (e) {
    if (cache) return { ...cache, source: cache.source + '_stale' };
    return { rates: FX_FALLBACK, source: 'fallback', fetchedAt: now };
  }
}

async function saveManualRates(rates) {
  const fresh = {
    rates: { TRY: 1, USD: Number(rates.USD), EUR: Number(rates.EUR) },
    source: 'manual',
    fetchedAt: Date.now(),
    date: new Date().toISOString().slice(0, 10),
  };
  await sSet(STORAGE_KEYS.fx, fresh);
  return fresh;
}

/* ============================================================
   MIGRATIONS
   ============================================================ */

async function runMigrations() {
  const vRes = await sGet(STORAGE_KEYS.schemaVersion);
  const version = vRes?.value ? parseInt(vRes.value, 10) : 1;

  if (version < 2) {
    const legacy = await sGet(STORAGE_KEYS.legacy);
    const oldTxs = legacy?.value ? JSON.parse(legacy.value) : [];

    const existingAccs = await loadList(STORAGE_KEYS.accounts);
    let defaultAcc;
    if (existingAccs.length === 0) {
      defaultAcc = {
        id: 'acc_default01',
        name: 'Nakit',
        type: 'nakit',
        currency: 'TRY',
        color: '#D4A574',
        initialBalance: 0,
        archived: false,
        createdAt: Date.now(),
      };
      await sSet(STORAGE_KEYS.accounts, [defaultAcc]);
    } else {
      defaultAcc = existingAccs[0];
    }

    if (oldTxs.length > 0) {
      const existingTxs = await loadList(STORAGE_KEYS.transactions);
      const migrated = oldTxs.map(t => ({
        id: t.id,
        type: t.type,
        accountId: defaultAcc.id,
        category: t.category,
        amount: t.amount,
        currency: 'TRY',
        fxRate: 1,
        amountTRY: t.amount,
        date: t.date,
        note: t.note || '',
        source: 'manual',
        createdAt: t.createdAt || Date.now(),
      }));
      await sSet(STORAGE_KEYS.transactions, [...existingTxs, ...migrated]);
      await sDel(STORAGE_KEYS.legacy);
      console.log(`[migration v1→v2] ${migrated.length} işlem "${defaultAcc.name}" hesabına taşındı`);
    }

    await sSet(STORAGE_KEYS.schemaVersion, '2');
  }

  if (version < 3) {
    const existing = await sGet(STORAGE_KEYS.recurring);
    if (!existing?.value) {
      await sSet(STORAGE_KEYS.recurring, []);
      console.log('[migration v2→v3] tekrar listesi başlatıldı');
    }
    await sSet(STORAGE_KEYS.schemaVersion, '3');
  }

  if (version < 4) {
    await sSet(STORAGE_KEYS.schemaVersion, '4');
    console.log('[migration v3→v4] kredi kartı desteği aktif');
  }

  if (version < 5) {
    const existing = await sGet(STORAGE_KEYS.budgetGoals);
    if (!existing?.value) {
      await sSet(STORAGE_KEYS.budgetGoals, []);
      console.log('[migration v4→v5] bütçe hedefleri başlatıldı');
    }
    await sSet(STORAGE_KEYS.schemaVersion, '5');
  }
}

/* ============================================================
   HELPERS
   ============================================================ */

function uid(prefix) {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}
function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
function getCat(type, id) {
  return CATS[type]?.find(c => c.id === id) || { label: 'Diğer', Icon: MoreHorizontal };
}
function getAccount(accounts, id) {
  return accounts.find(a => a.id === id);
}
function formatNum(n, digits = 2) {
  return new Intl.NumberFormat('tr-TR', { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(Math.abs(n));
}
function formatMoney(n, currency = 'TRY', signed = false) {
  const sym = CURRENCIES[currency]?.symbol || '';
  const sign = signed ? (n < 0 ? '−' : n > 0 ? '+' : '') : (n < 0 ? '−' : '');
  if (currency === 'TRY') return `${sign}${formatNum(n)} ₺`;
  return `${sign}${sym}${formatNum(n)}`;
}
function formatDateShort(s) {
  const [y, m, d] = s.split('-');
  return `${parseInt(d, 10)} ${AY_KISA[parseInt(m, 10) - 1]}`;
}
function relativeTime(ts) {
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
function convertToTRY(amount, currency, fxRates) {
  if (currency === 'TRY') return amount;
  const rate = fxRates[currency] || 0;
  return amount * rate;
}

/* ============================================================
   DATE MATH
   ============================================================ */

function daysInMonth(year, month0) {
  return new Date(year, month0 + 1, 0).getDate();
}
function parseDate(s) {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}
function toDateStr(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
function addDays(s, n) {
  const d = parseDate(s);
  d.setDate(d.getDate() + n);
  return toDateStr(d);
}
function cmpDate(a, b) {
  return a.localeCompare(b);
}
function formatDateLong(s) {
  const d = parseDate(s);
  return `${d.getDate()} ${AY_KISA[d.getMonth()]} ${d.getFullYear()}`;
}
function dayWithSuffix(n) {
  return `${n}.`;
}

/* ============================================================
   RECURRING ENGINE
   ============================================================ */

function nextOccurrence(rule, fromDateStr) {
  const from = parseDate(fromDateStr);
  const start = parseDate(rule.startDate);
  const cursor = from < start ? new Date(start) : new Date(from);

  if (rule.frequency === 'aylik') {
    const day = rule.dayOfMonth;
    let y = cursor.getFullYear(), m = cursor.getMonth();
    let actualDay = Math.min(day, daysInMonth(y, m));
    let candidate = new Date(y, m, actualDay);
    if (candidate < cursor) {
      m += 1;
      if (m > 11) { m = 0; y += 1; }
      actualDay = Math.min(day, daysInMonth(y, m));
      candidate = new Date(y, m, actualDay);
    }
    return toDateStr(candidate);
  }

  if (rule.frequency === 'haftalik') {
    const target = rule.dayOfWeek;
    let candidate = new Date(cursor);
    let safety = 0;
    while (candidate.getDay() !== target && safety++ < 10) {
      candidate.setDate(candidate.getDate() + 1);
    }
    return toDateStr(candidate);
  }

  if (rule.frequency === 'yillik') {
    const month = rule.monthOfYear - 1;
    const day = rule.dayOfMonth;
    let y = cursor.getFullYear();
    let actualDay = Math.min(day, daysInMonth(y, month));
    let candidate = new Date(y, month, actualDay);
    if (candidate < cursor) {
      y += 1;
      actualDay = Math.min(day, daysInMonth(y, month));
      candidate = new Date(y, month, actualDay);
    }
    return toDateStr(candidate);
  }

  return null;
}

function generateBetween(rule, startDateStr, endDateStr) {
  if (cmpDate(startDateStr, endDateStr) > 0) return [];
  const dates = [];
  let cursor = startDateStr;
  let safety = 0;
  while (safety++ < 500) {
    const next = nextOccurrence(rule, cursor);
    if (!next || cmpDate(next, endDateStr) > 0) break;
    dates.push(next);
    cursor = addDays(next, 1);
  }
  return dates;
}

function materializeRules(rules, accounts, fxRates) {
  const today = todayStr();
  const newTxs = [];
  const updatedRules = rules.map(rule => {
    if (!rule.active) return rule;

    const last = rule.lastGeneratedDate;
    const startCursor = last ? addDays(last, 1) : rule.startDate;
    const ruleEnd = rule.endDate || null;
    const endCursor = ruleEnd && cmpDate(ruleEnd, today) < 0 ? ruleEnd : today;

    if (cmpDate(startCursor, endCursor) > 0) {
      return rule.lastGeneratedDate === endCursor ? rule : { ...rule, lastGeneratedDate: endCursor };
    }

    const account = accounts.find(a => a.id === rule.accountId);
    if (!account) {
      return { ...rule, lastGeneratedDate: endCursor };
    }

    const dates = generateBetween(rule, startCursor, endCursor);
    const exceptions = rule.exceptions || [];

    for (const date of dates) {
      const exc = exceptions.find(e => e.date === date);
      if (exc?.action === 'skip') continue;

      const amount = (exc?.action === 'override' && exc.amount != null) ? exc.amount : rule.amount;
      const fxRate = rule.currency === 'TRY' ? 1 : (fxRates[rule.currency] || 0);
      const amountTRY = amount * fxRate;

      newTxs.push({
        id: uid('tx'),
        type: rule.type,
        accountId: rule.accountId,
        category: rule.category,
        amount,
        currency: rule.currency,
        fxRate,
        amountTRY,
        date,
        note: (exc?.action === 'override' && exc.note) ? exc.note : rule.name,
        source: 'recurring',
        sourceId: rule.id,
        createdAt: Date.now(),
      });
    }

    return { ...rule, lastGeneratedDate: endCursor };
  });

  return { newTxs, updatedRules };
}

function describeFrequency(rule) {
  if (rule.frequency === 'aylik') return `Her ayın ${rule.dayOfMonth}'i`;
  if (rule.frequency === 'haftalik') return `Her ${WEEKDAYS.find(w => w.id === rule.dayOfWeek)?.full || ''}`;
  if (rule.frequency === 'yillik') return `Her yıl ${rule.dayOfMonth} ${AYLAR[rule.monthOfYear - 1]}`;
  return '';
}

/* ============================================================
   CARD CYCLE ENGINE
   ============================================================ */

function getCycleForDate(card, dateStr) {
  const d = parseDate(dateStr);
  const day = d.getDate();
  let endY = d.getFullYear();
  let endM = d.getMonth();
  if (day >= card.cutoffDay) {
    endM += 1;
    if (endM > 11) { endM = 0; endY += 1; }
  }
  const endDate = new Date(endY, endM, card.cutoffDay - 1);
  const startDate = new Date(endY, endM - 1, card.cutoffDay);
  return cycleObj(card, endDate, startDate);
}

function cycleObj(card, endDate, startDate) {
  const endY = endDate.getFullYear();
  const endM = endDate.getMonth();
  let dueDate = null;
  if (card.paymentDueDay) {
    const dueInSameMonth = card.paymentDueDay > (card.cutoffDay - 1);
    let dueY = endY, dueM = dueInSameMonth ? endM : endM + 1;
    if (dueM > 11) { dueM = 0; dueY += 1; }
    const dueDayClamped = Math.min(card.paymentDueDay, daysInMonth(dueY, dueM));
    dueDate = toDateStr(new Date(dueY, dueM, dueDayClamped));
  }
  return {
    start: toDateStr(startDate),
    end: toDateStr(endDate),
    endY, endM,
    label: `${AYLAR[endM]} ${endY}`,
    shortLabel: `${AY_KISA[endM]} ${String(endY).slice(2)}`,
    dueDate,
  };
}

function getCycleByOffset(card, offset) {
  const current = getCurrentCycle(card);
  let endY = current.endY;
  let endM = current.endM + offset;
  while (endM < 0) { endM += 12; endY -= 1; }
  while (endM > 11) { endM -= 12; endY += 1; }
  const endDate = new Date(endY, endM, card.cutoffDay - 1);
  const startDate = new Date(endY, endM - 1, card.cutoffDay);
  return cycleObj(card, endDate, startDate);
}

function getCurrentCycle(card) {
  return getCycleForDate(card, todayStr());
}

function txInCycle(tx, cycle) {
  return cmpDate(tx.date, cycle.start) >= 0 && cmpDate(tx.date, cycle.end) <= 0;
}

/* ============================================================
   RECURRING FORECAST
   ============================================================ */

function forecastRecurringInRange(rules, accountId, startDateStr, endDateStr, fxRates) {
  const items = [];
  for (const rule of rules) {
    if (!rule.active) continue;
    if (rule.accountId !== accountId) continue;
    const fromDate = rule.lastGeneratedDate ? addDays(rule.lastGeneratedDate, 1) : rule.startDate;
    const effectiveStart = cmpDate(fromDate, startDateStr) > 0 ? fromDate : startDateStr;
    const ruleEnd = rule.endDate ? rule.endDate : '9999-12-31';
    const effectiveEnd = cmpDate(ruleEnd, endDateStr) < 0 ? ruleEnd : endDateStr;
    if (cmpDate(effectiveStart, effectiveEnd) > 0) continue;
    const dates = generateBetween(rule, effectiveStart, effectiveEnd);
    const exceptions = rule.exceptions || [];
    for (const date of dates) {
      const exc = exceptions.find(e => e.date === date);
      if (exc?.action === 'skip') continue;
      const amount = (exc?.action === 'override' && exc.amount != null) ? exc.amount : rule.amount;
      const fxRate = rule.currency === 'TRY' ? 1 : (fxRates[rule.currency] || 0);
      items.push({
        forecastId: `fc_${rule.id}_${date}`,
        date,
        type: rule.type,
        category: rule.category,
        amount,
        currency: rule.currency,
        fxRate,
        amountTRY: amount * fxRate,
        note: rule.name,
        sourceRuleId: rule.id,
        isForecast: true,
      });
    }
  }
  return items;
}

/* ============================================================
   FORECAST / PROJECTION ENGINE
   ============================================================ */

function getSettledBalanceTRY(accounts, txs, fxRates, asOfDate) {
  let total = 0;
  for (const acc of accounts) {
    let native = acc.initialBalance || 0;
    for (const t of txs) {
      if (t.accountId !== acc.id) continue;
      if (cmpDate(t.date, asOfDate) > 0) continue;
      native += t.type === 'gelir' ? t.amount : -t.amount;
    }
    const rate = acc.currency === 'TRY' ? 1 : (fxRates[acc.currency] || 0);
    total += native * rate;
  }
  return total;
}

function projectMonthlyFlows(months, accounts, txs, recurringRules, fxRates) {
  // months: [{y, m}, ...] (0-indexed month)
  return months.map(({ y, m }) => {
    const monthStart = toDateStr(new Date(y, m, 1));
    const monthEnd = toDateStr(new Date(y, m + 1, 0));
    let income = 0, expense = 0;
    let manualIn = 0, manualOut = 0;
    let forecastIn = 0, forecastOut = 0;

    // Already-recorded transactions
    for (const t of txs) {
      if (cmpDate(t.date, monthStart) < 0 || cmpDate(t.date, monthEnd) > 0) continue;
      const trySum = t.amountTRY != null ? t.amountTRY : convertToTRY(t.amount, t.currency, fxRates);
      if (t.type === 'gelir') {
        income += trySum;
        if (t.source === 'manual') manualIn += trySum;
      } else {
        expense += trySum;
        if (t.source === 'manual') manualOut += trySum;
      }
    }

    // Future recurring projections (only count occurrences not yet materialized)
    for (const acc of accounts) {
      const items = forecastRecurringInRange(recurringRules, acc.id, monthStart, monthEnd, fxRates);
      for (const it of items) {
        if (it.type === 'gelir') { income += it.amountTRY; forecastIn += it.amountTRY; }
        else { expense += it.amountTRY; forecastOut += it.amountTRY; }
      }
    }

    return {
      y, m,
      label: AY_KISA[m],
      fullLabel: `${AY_KISA[m]} ${String(y).slice(2)}`,
      income, expense,
      net: income - expense,
      manualIn, manualOut,
      forecastIn, forecastOut,
    };
  });
}

function forecastBalanceTRY(accounts, txs, recurringRules, fxRates, asOfDate) {
  // Settled balance plus projected recurring contributions up to asOfDate
  const today = todayStr();
  const base = getSettledBalanceTRY(accounts, txs, fxRates, today);
  if (cmpDate(asOfDate, today) <= 0) return base;
  let delta = 0;
  for (const acc of accounts) {
    const items = forecastRecurringInRange(recurringRules, acc.id, addDays(today, 1), asOfDate, fxRates);
    for (const it of items) {
      delta += it.type === 'gelir' ? it.amountTRY : -it.amountTRY;
    }
  }
  return base + delta;
}

/* ============================================================
   ACCOUNT BALANCE
   ============================================================ */

function getAccountNativeBalance(account, txs, asOfDate = null) {
  let bal = account.initialBalance || 0;
  for (const t of txs) {
    if (t.accountId !== account.id) continue;
    if (asOfDate && cmpDate(t.date, asOfDate) > 0) continue;
    bal += t.type === 'gelir' ? t.amount : -t.amount;
  }
  return bal;
}

function getAccountBalanceTRY(account, txs, fxRates, asOfDate = null) {
  const native = getAccountNativeBalance(account, txs, asOfDate);
  const rate = account.currency === 'TRY' ? 1 : (fxRates[account.currency] || 0);
  return native * rate;
}

/* ============================================================
   ROOT COMPONENT
   ============================================================ */

const INITIAL_FX = { rates: FX_FALLBACK, source: 'loading', fetchedAt: 0 };

export default function App() {
  const [booted, setBooted] = useState(false);
  const [view, setView] = useState({ name: 'dashboard' });
  const [accounts, setAccounts] = useState([]);
  const [txs, setTxs] = useState([]);
  const [recurring, setRecurring] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [fx, setFx] = useState(INITIAL_FX);
  const [modal, setModal] = useState(null); // { kind, payload }
  const [toast, setToast] = useState(null);

  // Bootstrap
  useEffect(() => {
    (async () => {
      await runMigrations();
      const [accs, t, r, b, fxData] = await Promise.all([
        loadList(STORAGE_KEYS.accounts),
        loadList(STORAGE_KEYS.transactions),
        loadList(STORAGE_KEYS.recurring),
        loadList(STORAGE_KEYS.budgetGoals),
        ensureFxRates(false),
      ]);

      // Materialize recurring rules up to today
      const { newTxs, updatedRules } = materializeRules(r, accs, fxData.rates);
      let txsAfter = t;
      let rulesAfter = updatedRules;
      if (newTxs.length > 0) {
        txsAfter = [...t, ...newTxs];
        await sSet(STORAGE_KEYS.transactions, txsAfter);
        console.log(`[recurring] ${newTxs.length} işlem üretildi`);
      }
      // Persist updated lastGeneratedDate
      if (JSON.stringify(rulesAfter) !== JSON.stringify(r)) {
        await sSet(STORAGE_KEYS.recurring, rulesAfter);
      }

      setAccounts(accs);
      setTxs(txsAfter);
      setRecurring(rulesAfter);
      setBudgets(b);
      setFx(fxData);
      setBooted(true);
    })();
  }, []);

  // Toast auto-dismiss
  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), 2400);
    return () => clearTimeout(id);
  }, [toast]);

  const flashToast = useCallback((message, kind = 'info') => {
    setToast({ message, kind });
  }, []);

  /* ---------- Persistence helpers ---------- */
  const saveAccounts = useCallback(async (next) => {
    setAccounts(next);
    await sSet(STORAGE_KEYS.accounts, next);
  }, []);
  const saveTxs = useCallback(async (next) => {
    setTxs(next);
    await sSet(STORAGE_KEYS.transactions, next);
  }, []);
  const saveRecurring = useCallback(async (next) => {
    setRecurring(next);
    await sSet(STORAGE_KEYS.recurring, next);
  }, []);
  const saveBudgets = useCallback(async (next) => {
    setBudgets(next);
    await sSet(STORAGE_KEYS.budgetGoals, next);
  }, []);

  /* ---------- FX refresh ---------- */
  const refreshFx = useCallback(async (force = true) => {
    const fresh = await ensureFxRates(force);
    setFx(fresh);
    if (fresh.source === 'frankfurter') flashToast('Kurlar güncellendi', 'success');
    else if (fresh.source === 'manual') flashToast('Manuel kurlar kaydedildi', 'success');
    else if (fresh.source.endsWith('_stale')) flashToast('Çevrimdışı: son bilinen kur kullanılıyor', 'warn');
    else flashToast('Kurlar alınamadı, fallback kullanılıyor', 'warn');
    return fresh;
  }, [flashToast]);

  /* ---------- CRUD: Accounts ---------- */
  const upsertAccount = useCallback(async (acc) => {
    const exists = accounts.some(a => a.id === acc.id);
    const next = exists ? accounts.map(a => a.id === acc.id ? acc : a) : [...accounts, acc];
    await saveAccounts(next);
    flashToast(exists ? 'Hesap güncellendi' : 'Hesap eklendi', 'success');
  }, [accounts, saveAccounts, flashToast]);

  const deleteAccount = useCallback(async (id) => {
    const hasTxs = txs.some(t => t.accountId === id);
    if (hasTxs) {
      flashToast('Bu hesapta işlem var, önce taşıyın', 'warn');
      return;
    }
    await saveAccounts(accounts.filter(a => a.id !== id));
    flashToast('Hesap silindi', 'success');
  }, [accounts, txs, saveAccounts, flashToast]);

  /* ---------- CRUD: Transactions ---------- */
  const upsertTx = useCallback(async (tx) => {
    const exists = txs.some(t => t.id === tx.id);
    const next = exists ? txs.map(t => t.id === tx.id ? tx : t) : [...txs, tx];
    await saveTxs(next);
    flashToast(exists ? 'İşlem güncellendi' : 'İşlem eklendi', 'success');
  }, [txs, saveTxs, flashToast]);

  const deleteTx = useCallback(async (id) => {
    await saveTxs(txs.filter(t => t.id !== id));
    flashToast('İşlem silindi', 'success');
  }, [txs, saveTxs, flashToast]);

  const transferBetween = useCallback(async ({ fromId, toId, amount, date, note }) => {
    const from = getAccount(accounts, fromId);
    const to = getAccount(accounts, toId);
    if (!from || !to) return;
    const transferId = uid('xfr');
    const fxRateFrom = from.currency === 'TRY' ? 1 : (fx.rates[from.currency] || 0);
    const fxRateTo = to.currency === 'TRY' ? 1 : (fx.rates[to.currency] || 0);
    // Amount is entered in `from` currency; convert into `to` currency through TRY
    const amountTRY = amount * fxRateFrom;
    const amountTo = fxRateTo ? amountTRY / fxRateTo : amount;

    const out = {
      id: uid('tx'),
      type: 'gider',
      accountId: fromId,
      category: 'diger',
      amount,
      currency: from.currency,
      fxRate: fxRateFrom,
      amountTRY,
      date,
      note: note || `Transfer → ${to.name}`,
      source: 'transfer',
      transferId,
      createdAt: Date.now(),
    };
    const inn = {
      id: uid('tx'),
      type: 'gelir',
      accountId: toId,
      category: 'diger_g',
      amount: Number(amountTo.toFixed(2)),
      currency: to.currency,
      fxRate: fxRateTo,
      amountTRY,
      date,
      note: note || `Transfer ← ${from.name}`,
      source: 'transfer',
      transferId,
      createdAt: Date.now(),
    };
    await saveTxs([...txs, out, inn]);
    flashToast('Transfer kaydedildi', 'success');
  }, [accounts, txs, fx, saveTxs, flashToast]);

  /* ---------- CRUD: Recurring ---------- */
  const upsertRule = useCallback(async (rule) => {
    const exists = recurring.some(r => r.id === rule.id);
    const next = exists ? recurring.map(r => r.id === rule.id ? rule : r) : [...recurring, rule];
    await saveRecurring(next);
    flashToast(exists ? 'Tekrar güncellendi' : 'Tekrar eklendi', 'success');
  }, [recurring, saveRecurring, flashToast]);

  const deleteRule = useCallback(async (id) => {
    await saveRecurring(recurring.filter(r => r.id !== id));
    flashToast('Tekrar silindi', 'success');
  }, [recurring, saveRecurring, flashToast]);

  const toggleRule = useCallback(async (id) => {
    await saveRecurring(recurring.map(r => r.id === id ? { ...r, active: !r.active } : r));
  }, [recurring, saveRecurring]);

  /* ---------- CRUD: Budgets ---------- */
  const upsertBudget = useCallback(async (goal) => {
    const exists = budgets.some(b => b.id === goal.id);
    const next = exists ? budgets.map(b => b.id === goal.id ? goal : b) : [...budgets, goal];
    await saveBudgets(next);
    flashToast(exists ? 'Hedef güncellendi' : 'Hedef eklendi', 'success');
  }, [budgets, saveBudgets, flashToast]);

  const deleteBudget = useCallback(async (id) => {
    await saveBudgets(budgets.filter(b => b.id !== id));
    flashToast('Hedef silindi', 'success');
  }, [budgets, saveBudgets, flashToast]);

  if (!booted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50 text-stone-500">
        <div className="flex items-center gap-3">
          <RefreshCw className="w-5 h-5 animate-spin" /> Yükleniyor…
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 text-stone-800 pb-24">
      <Header view={view} setView={setView} fx={fx} onRefreshFx={() => refreshFx(true)} />
      <main className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        {view.name === 'dashboard' && (
          <Dashboard
            accounts={accounts} txs={txs} recurring={recurring} budgets={budgets} fx={fx}
            setView={setView}
            onAdd={() => setModal({ kind: 'tx', payload: null })}
            onTransfer={() => setModal({ kind: 'transfer' })}
          />
        )}
        {view.name === 'accounts' && (
          <AccountsPage
            accounts={accounts} txs={txs} fx={fx}
            onAdd={() => setModal({ kind: 'account', payload: null })}
            onEdit={(a) => setModal({ kind: 'account', payload: a })}
            onDelete={deleteAccount}
            onOpen={(a) => a.type === 'kredi_karti' ? setView({ name: 'card', accountId: a.id }) : null}
          />
        )}
        {view.name === 'transactions' && (
          <TransactionsPage
            accounts={accounts} txs={txs} fx={fx}
            onAdd={() => setModal({ kind: 'tx', payload: null })}
            onEdit={(t) => setModal({ kind: 'tx', payload: t })}
            onDelete={deleteTx}
          />
        )}
        {view.name === 'recurring' && (
          <RecurringPage
            rules={recurring} accounts={accounts}
            onAdd={() => setModal({ kind: 'recurring', payload: null })}
            onEdit={(r) => setModal({ kind: 'recurring', payload: r })}
            onDelete={deleteRule}
            onToggle={toggleRule}
          />
        )}
        {view.name === 'budgets' && (
          <BudgetsPage
            budgets={budgets} txs={txs} fx={fx}
            onAdd={() => setModal({ kind: 'budget', payload: null })}
            onEdit={(g) => setModal({ kind: 'budget', payload: g })}
            onDelete={deleteBudget}
          />
        )}
        {view.name === 'card' && (
          <CardCyclePage
            accountId={view.accountId}
            accounts={accounts} txs={txs} fx={fx}
            onBack={() => setView({ name: 'accounts' })}
          />
        )}
        {view.name === 'settings' && (
          <SettingsPage
            fx={fx}
            onRefresh={() => refreshFx(true)}
            onManual={async (r) => { const fresh = await saveManualRates(r); setFx(fresh); flashToast('Manuel kurlar kaydedildi', 'success'); }}
          />
        )}
      </main>

      <BottomNav view={view} setView={setView} onQuickAdd={() => setModal({ kind: 'tx', payload: null })} />

      {modal?.kind === 'tx' && (
        <TxModal
          tx={modal.payload}
          accounts={accounts}
          fx={fx}
          onClose={() => setModal(null)}
          onSave={async (t) => { await upsertTx(t); setModal(null); }}
          onDelete={modal.payload ? async () => { await deleteTx(modal.payload.id); setModal(null); } : null}
        />
      )}
      {modal?.kind === 'account' && (
        <AccountModal
          account={modal.payload}
          onClose={() => setModal(null)}
          onSave={async (a) => { await upsertAccount(a); setModal(null); }}
        />
      )}
      {modal?.kind === 'transfer' && (
        <TransferModal
          accounts={accounts}
          onClose={() => setModal(null)}
          onSave={async (data) => { await transferBetween(data); setModal(null); }}
        />
      )}
      {modal?.kind === 'recurring' && (
        <RecurringModal
          rule={modal.payload}
          accounts={accounts}
          onClose={() => setModal(null)}
          onSave={async (r) => { await upsertRule(r); setModal(null); }}
        />
      )}
      {modal?.kind === 'budget' && (
        <BudgetModal
          goal={modal.payload}
          onClose={() => setModal(null)}
          onSave={async (g) => { await upsertBudget(g); setModal(null); }}
        />
      )}

      {toast && (
        <div className={`fixed bottom-24 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full shadow-lg text-sm font-medium z-50 ${
          toast.kind === 'success' ? 'bg-emerald-600 text-white' :
          toast.kind === 'warn' ? 'bg-amber-500 text-white' : 'bg-stone-800 text-white'
        }`}>
          {toast.message}
        </div>
      )}
    </div>
  );
}

/* ============================================================
   HEADER + NAV
   ============================================================ */

function Header({ view, setView, fx, onRefreshFx }) {
  return (
    <header className="bg-white border-b border-stone-200 sticky top-0 z-30">
      <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-3">
        <button onClick={() => setView({ name: 'dashboard' })} className="font-semibold text-lg text-stone-800">
          Bütçe
        </button>
        <div className="ml-auto flex items-center gap-2 text-xs">
          <button
            onClick={onRefreshFx}
            className="px-3 py-1.5 rounded-full bg-stone-100 hover:bg-stone-200 flex items-center gap-1.5 text-stone-700"
            title="Kurları güncelle"
          >
            <Globe className="w-3.5 h-3.5" />
            <span>USD {formatNum(fx.rates.USD, 2)} · EUR {formatNum(fx.rates.EUR, 2)}</span>
            <RefreshCw className="w-3 h-3" />
          </button>
          <button
            onClick={() => setView({ name: 'settings' })}
            className="px-2 py-1.5 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-700"
            title="Ayarlar"
          >
            <Info className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </header>
  );
}

function BottomNav({ view, setView, onQuickAdd }) {
  const tabs = [
    { id: 'dashboard', label: 'Özet', Icon: Activity },
    { id: 'accounts', label: 'Hesaplar', Icon: Wallet },
    { id: 'transactions', label: 'İşlemler', Icon: Layers },
    { id: 'recurring', label: 'Tekrarlar', Icon: Repeat },
    { id: 'budgets', label: 'Bütçe', Icon: Target },
  ];
  return (
    <nav className="fixed bottom-0 inset-x-0 bg-white border-t border-stone-200 z-30">
      <div className="max-w-5xl mx-auto px-2 py-2 flex items-center gap-1">
        {tabs.map(t => {
          const active = view.name === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setView({ name: t.id })}
              className={`flex-1 flex flex-col items-center gap-0.5 py-2 rounded-lg ${active ? 'text-amber-700 bg-amber-50' : 'text-stone-500 hover:text-stone-700'}`}
            >
              <t.Icon className="w-5 h-5" />
              <span className="text-[11px] font-medium">{t.label}</span>
            </button>
          );
        })}
        <button
          onClick={onQuickAdd}
          className="ml-1 w-11 h-11 rounded-full bg-amber-600 text-white flex items-center justify-center shadow"
          title="İşlem ekle"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>
    </nav>
  );
}

/* ============================================================
   DASHBOARD
   ============================================================ */

function Dashboard({ accounts, txs, recurring, budgets, fx, setView, onAdd, onTransfer }) {
  const today = todayStr();
  const totalTRY = useMemo(
    () => accounts.reduce((s, a) => s + getAccountBalanceTRY(a, txs, fx.rates), 0),
    [accounts, txs, fx]
  );

  const now = new Date();
  const allMonths = useMemo(() => {
    const arr = [];
    for (let i = -5; i <= 6; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
      arr.push({ y: d.getFullYear(), m: d.getMonth(), isForecast: i > 0 });
    }
    return arr;
  }, [now.getFullYear(), now.getMonth()]);

  const flows = useMemo(() => {
    const raw = projectMonthlyFlows(allMonths, accounts, txs, recurring, fx.rates);
    return raw.map((f, i) => ({ ...f, isForecast: allMonths[i].isForecast }));
  }, [allMonths, accounts, txs, recurring, fx]);

  // Current month is at index 5 (offsets -5..+6)
  const thisMonth = flows[5] || { income: 0, expense: 0, net: 0 };
  // First forecast bar — used as x for the "Tahmin" reference line
  const forecastBoundary = flows[6]?.fullLabel;

  // Category breakdown — current month, expenses
  const monthStart = toDateStr(new Date(now.getFullYear(), now.getMonth(), 1));
  const monthEnd = toDateStr(new Date(now.getFullYear(), now.getMonth() + 1, 0));
  const catBreakdown = useMemo(() => {
    const m = new Map();
    for (const t of txs) {
      if (t.type !== 'gider') continue;
      if (cmpDate(t.date, monthStart) < 0 || cmpDate(t.date, monthEnd) > 0) continue;
      const trySum = t.amountTRY != null ? t.amountTRY : convertToTRY(t.amount, t.currency, fx.rates);
      m.set(t.category, (m.get(t.category) || 0) + trySum);
    }
    return [...m.entries()]
      .map(([id, value]) => ({ id, label: getCat('gider', id).label, value }))
      .sort((a, b) => b.value - a.value);
  }, [txs, monthStart, monthEnd, fx]);

  // Recent txs
  const recent = useMemo(
    () => [...txs].sort((a, b) => cmpDate(b.date, a.date) || b.createdAt - a.createdAt).slice(0, 6),
    [txs]
  );

  // 30-day forecast balance
  const horizon = addDays(today, 30);
  const forecast30 = useMemo(
    () => forecastBalanceTRY(accounts, txs, recurring, fx.rates, horizon),
    [accounts, txs, recurring, fx, horizon]
  );

  return (
    <div className="space-y-6">
      <section className="rounded-2xl bg-gradient-to-br from-amber-700 to-amber-600 text-white p-5 shadow">
        <div className="text-xs uppercase tracking-wide text-amber-100/80">Toplam Bakiye</div>
        <div className="text-3xl font-semibold mt-1">{formatMoney(totalTRY, 'TRY')}</div>
        <div className="mt-1 text-xs text-amber-100/80">
          30 gün sonra tahmin: {formatMoney(forecast30, 'TRY')}
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <button onClick={onAdd} className="rounded-xl bg-white/15 hover:bg-white/25 backdrop-blur px-3 py-2 text-sm flex items-center justify-center gap-1.5">
            <Plus className="w-4 h-4" /> İşlem ekle
          </button>
          <button onClick={onTransfer} className="rounded-xl bg-white/15 hover:bg-white/25 backdrop-blur px-3 py-2 text-sm flex items-center justify-center gap-1.5">
            <ArrowLeftRight className="w-4 h-4" /> Transfer
          </button>
        </div>
      </section>

      <section className="grid grid-cols-3 gap-3">
        <StatCard label="Bu ay gelir" value={formatMoney(thisMonth.income, 'TRY')} Icon={ArrowDownRight} tone="emerald" />
        <StatCard label="Bu ay gider" value={formatMoney(thisMonth.expense, 'TRY')} Icon={ArrowUpRight} tone="rose" />
        <StatCard label="Bu ay net" value={formatMoney(thisMonth.net, 'TRY', true)} Icon={TrendingUp} tone={thisMonth.net >= 0 ? 'emerald' : 'rose'} />
      </section>

      <section className="bg-white rounded-2xl border border-stone-200 p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="font-semibold text-stone-800">Son 6 ay · Tahmin 6 ay</div>
          <div className="text-xs text-stone-500 flex items-center gap-2">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-emerald-400" />Gelir</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-rose-400" />Gider</span>
          </div>
        </div>
        <div className="h-56">
          <ResponsiveContainer>
            <BarChart data={flows} margin={{ top: 12, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid stroke="#f1ede6" vertical={false} />
              <XAxis dataKey="fullLabel" tick={{ fontSize: 10, fill: '#78716c' }} axisLine={false} tickLine={false} interval={0} />
              <YAxis tick={{ fontSize: 11, fill: '#78716c' }} axisLine={false} tickLine={false} width={40} tickFormatter={(v) => Math.round(v / 1000) + 'k'} />
              <Tooltip
                formatter={(v, n) => [formatMoney(v, 'TRY'), n === 'income' ? 'Gelir' : 'Gider']}
                labelFormatter={(label, payload) => {
                  const f = payload?.[0]?.payload;
                  return f?.isForecast ? `${label} · tahmin` : label;
                }}
                contentStyle={{ borderRadius: 10, border: '1px solid #e7e5e4', fontSize: 12 }}
              />
              {forecastBoundary && (
                <ReferenceLine
                  x={forecastBoundary}
                  stroke="#a8a29e"
                  strokeDasharray="3 3"
                  label={{ value: 'Tahmin', position: 'top', fontSize: 10, fill: '#78716c' }}
                />
              )}
              <Bar dataKey="income" radius={[4, 4, 0, 0]}>
                {flows.map((f, i) => (
                  <Cell key={`in-${i}`} fill={f.isForecast ? '#A8C88660' : '#A8C886'} />
                ))}
              </Bar>
              <Bar dataKey="expense" radius={[4, 4, 0, 0]}>
                {flows.map((f, i) => (
                  <Cell key={`ex-${i}`} fill={f.isForecast ? '#DC8A6E60' : '#DC8A6E'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="grid md:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-stone-200 p-4">
          <div className="font-semibold mb-2 text-stone-800">Kategori dağılımı (bu ay)</div>
          {catBreakdown.length === 0 ? (
            <div className="text-sm text-stone-500 py-8 text-center">Bu ay henüz gider yok.</div>
          ) : (
            <div className="h-48 flex items-center">
              <div className="flex-1 h-full">
                <ResponsiveContainer>
                  <PieChart>
                    <Pie data={catBreakdown} dataKey="value" nameKey="label" innerRadius={32} outerRadius={68} paddingAngle={2}>
                      {catBreakdown.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                    </Pie>
                    <Tooltip formatter={(v) => formatMoney(v, 'TRY')} contentStyle={{ borderRadius: 10, border: '1px solid #e7e5e4', fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <ul className="flex-1 text-xs space-y-1 pr-2">
                {catBreakdown.slice(0, 6).map((c, i) => (
                  <li key={c.id} className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-sm" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                    <span className="flex-1 text-stone-700 truncate">{c.label}</span>
                    <span className="text-stone-500">{formatNum(c.value, 0)} ₺</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-stone-200 p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="font-semibold text-stone-800">Son işlemler</div>
            <button onClick={() => setView({ name: 'transactions' })} className="text-xs text-amber-700 hover:underline">Tümü</button>
          </div>
          {recent.length === 0 ? (
            <div className="text-sm text-stone-500 py-6 text-center">Henüz işlem yok.</div>
          ) : (
            <ul className="space-y-1.5">
              {recent.map(t => <TxRow key={t.id} tx={t} accounts={accounts} compact />)}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}

function StatCard({ label, value, Icon, tone }) {
  const palette = {
    emerald: 'bg-emerald-50 text-emerald-700',
    rose: 'bg-rose-50 text-rose-700',
    amber: 'bg-amber-50 text-amber-700',
  }[tone] || 'bg-stone-100 text-stone-700';
  return (
    <div className="bg-white rounded-2xl border border-stone-200 p-3">
      <div className="flex items-center gap-2 text-xs text-stone-500">
        <span className={`w-6 h-6 rounded-full flex items-center justify-center ${palette}`}><Icon className="w-3.5 h-3.5" /></span>
        {label}
      </div>
      <div className="mt-1.5 font-semibold text-stone-800 text-sm">{value}</div>
    </div>
  );
}

/* ============================================================
   ACCOUNTS PAGE
   ============================================================ */

function AccountsPage({ accounts, txs, fx, onAdd, onEdit, onDelete, onOpen }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-stone-800">Hesaplar</h2>
        <button onClick={onAdd} className="px-3 py-1.5 rounded-full bg-amber-600 text-white text-sm flex items-center gap-1.5">
          <Plus className="w-4 h-4" /> Hesap
        </button>
      </div>

      {accounts.length === 0 ? (
        <EmptyState text="Henüz hesap yok. İlk hesabını oluştur." />
      ) : (
        <ul className="space-y-2">
          {accounts.map(a => {
            const Icon = ACCOUNT_TYPES[a.type]?.Icon || Wallet;
            const native = getAccountNativeBalance(a, txs);
            const tryEq = getAccountBalanceTRY(a, txs, fx.rates);
            const isCard = a.type === 'kredi_karti';
            return (
              <li key={a.id} className="bg-white rounded-2xl border border-stone-200 p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: a.color + '20', color: a.color }}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-stone-800 truncate">{a.name}</div>
                  <div className="text-xs text-stone-500">
                    {ACCOUNT_TYPES[a.type]?.label} · {a.currency}
                    {isCard && a.cutoffDay ? ` · Kesim ${a.cutoffDay}. gün` : ''}
                  </div>
                </div>
                <div className="text-right">
                  <div className={`font-semibold ${native < 0 ? 'text-rose-700' : 'text-stone-800'}`}>
                    {formatMoney(native, a.currency)}
                  </div>
                  {a.currency !== 'TRY' && (
                    <div className="text-xs text-stone-500">≈ {formatMoney(tryEq, 'TRY')}</div>
                  )}
                </div>
                <div className="flex items-center gap-1 ml-2">
                  {isCard && (
                    <button onClick={() => onOpen(a)} className="p-2 rounded-lg hover:bg-stone-100 text-stone-600" title="Ekstre">
                      <Calendar className="w-4 h-4" />
                    </button>
                  )}
                  <button onClick={() => onEdit(a)} className="p-2 rounded-lg hover:bg-stone-100 text-stone-600">
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button onClick={() => onDelete(a.id)} className="p-2 rounded-lg hover:bg-rose-50 text-rose-600">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

/* ============================================================
   TRANSACTIONS PAGE
   ============================================================ */

function TransactionsPage({ accounts, txs, fx, onAdd, onEdit, onDelete }) {
  const [filterType, setFilterType] = useState('all');
  const [filterAccount, setFilterAccount] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');

  const filtered = useMemo(() => {
    return txs
      .filter(t => filterType === 'all' || t.type === filterType)
      .filter(t => filterAccount === 'all' || t.accountId === filterAccount)
      .filter(t => filterCategory === 'all' || t.category === filterCategory)
      .sort((a, b) => cmpDate(b.date, a.date) || b.createdAt - a.createdAt);
  }, [txs, filterType, filterAccount, filterCategory]);

  // Group by date
  const groups = useMemo(() => {
    const m = new Map();
    for (const t of filtered) {
      if (!m.has(t.date)) m.set(t.date, []);
      m.get(t.date).push(t);
    }
    return [...m.entries()];
  }, [filtered]);

  const categoryOptions = filterType === 'gelir' ? CATS.gelir : filterType === 'gider' ? CATS.gider : [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-stone-800">İşlemler</h2>
        <button onClick={onAdd} className="px-3 py-1.5 rounded-full bg-amber-600 text-white text-sm flex items-center gap-1.5">
          <Plus className="w-4 h-4" /> İşlem
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-stone-200 p-3 flex flex-wrap gap-2 items-center text-sm">
        <Pill active={filterType === 'all'} onClick={() => { setFilterType('all'); setFilterCategory('all'); }}>Tümü</Pill>
        <Pill active={filterType === 'gelir'} onClick={() => { setFilterType('gelir'); setFilterCategory('all'); }} tone="emerald">Gelir</Pill>
        <Pill active={filterType === 'gider'} onClick={() => { setFilterType('gider'); setFilterCategory('all'); }} tone="rose">Gider</Pill>
        <select
          value={filterAccount}
          onChange={(e) => setFilterAccount(e.target.value)}
          className="ml-auto bg-stone-100 rounded-full px-3 py-1 text-xs"
        >
          <option value="all">Tüm hesaplar</option>
          {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
        </select>
        {categoryOptions.length > 0 && (
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="bg-stone-100 rounded-full px-3 py-1 text-xs"
          >
            <option value="all">Tüm kategoriler</option>
            {categoryOptions.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
          </select>
        )}
      </div>

      {groups.length === 0 ? (
        <EmptyState text="İşlem yok." />
      ) : (
        <div className="space-y-4">
          {groups.map(([date, items]) => (
            <div key={date} className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
              <div className="px-4 py-2 text-xs uppercase tracking-wide text-stone-500 bg-stone-50 border-b border-stone-100">
                {formatDateLong(date)}
              </div>
              <ul className="divide-y divide-stone-100">
                {items.map(t => (
                  <li key={t.id} className="px-4 py-2.5 hover:bg-stone-50 flex items-center gap-3 cursor-pointer" onClick={() => onEdit(t)}>
                    <TxRow tx={t} accounts={accounts} expanded />
                    <button
                      onClick={(e) => { e.stopPropagation(); onDelete(t.id); }}
                      className="p-1.5 rounded hover:bg-rose-50 text-rose-500"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function TxRow({ tx, accounts, compact, expanded }) {
  const cat = getCat(tx.type, tx.category);
  const Icon = cat.Icon;
  const isIncome = tx.type === 'gelir';
  const acc = getAccount(accounts, tx.accountId);
  const accColor = acc?.color || '#999';
  return (
    <>
      <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: accColor + '20', color: accColor }}>
        <Icon className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-stone-800 truncate">{tx.note || cat.label}</div>
        <div className="text-xs text-stone-500 flex items-center gap-1 truncate">
          <span>{cat.label}</span>
          {acc && <span>· {acc.name}</span>}
          {tx.source === 'recurring' && <span className="text-amber-700">· tekrar</span>}
          {tx.source === 'transfer' && <span className="text-sky-700">· transfer</span>}
          {!compact && expanded && <span className="text-stone-400">· {formatDateShort(tx.date)}</span>}
        </div>
      </div>
      <div className="text-right">
        <div className={`font-semibold ${isIncome ? 'text-emerald-700' : 'text-rose-700'}`}>
          {isIncome ? '+' : '−'}{formatNum(tx.amount)} {CURRENCIES[tx.currency]?.symbol || ''}
        </div>
        {tx.currency !== 'TRY' && (
          <div className="text-xs text-stone-500">≈ {formatNum(tx.amountTRY ?? 0, 0)} ₺</div>
        )}
      </div>
    </>
  );
}

/* ============================================================
   RECURRING PAGE
   ============================================================ */

function RecurringPage({ rules, accounts, onAdd, onEdit, onDelete, onToggle }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-stone-800">Tekrarlar</h2>
        <button onClick={onAdd} className="px-3 py-1.5 rounded-full bg-amber-600 text-white text-sm flex items-center gap-1.5">
          <Plus className="w-4 h-4" /> Tekrar
        </button>
      </div>

      {rules.length === 0 ? (
        <EmptyState text="Düzenli ödeme veya gelir varsa tekrar olarak ekle." />
      ) : (
        <ul className="space-y-2">
          {rules.map(r => {
            const acc = getAccount(accounts, r.accountId);
            const isIncome = r.type === 'gelir';
            const upcoming = r.active ? nextOccurrence(r, addDays(r.lastGeneratedDate || addDays(todayStr(), -1), 1)) : null;
            return (
              <li key={r.id} className={`bg-white rounded-2xl border border-stone-200 p-4 flex items-center gap-3 ${r.active ? '' : 'opacity-60'}`}>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isIncome ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                  <Repeat className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-stone-800 truncate">{r.name}</div>
                  <div className="text-xs text-stone-500">
                    {describeFrequency(r)} · {acc?.name || 'Hesap silinmiş'}
                  </div>
                  {upcoming && (
                    <div className="text-xs text-amber-700 mt-0.5">Sonraki: {formatDateLong(upcoming)}</div>
                  )}
                </div>
                <div className="text-right">
                  <div className={`font-semibold ${isIncome ? 'text-emerald-700' : 'text-rose-700'}`}>
                    {isIncome ? '+' : '−'}{formatNum(r.amount)} {CURRENCIES[r.currency]?.symbol || ''}
                  </div>
                </div>
                <div className="flex items-center gap-1 ml-2">
                  <button onClick={() => onToggle(r.id)} className="p-2 rounded-lg hover:bg-stone-100 text-stone-600" title={r.active ? 'Duraklat' : 'Aktifleştir'}>
                    {r.active ? <PauseCircle className="w-4 h-4" /> : <PlayCircle className="w-4 h-4" />}
                  </button>
                  <button onClick={() => onEdit(r)} className="p-2 rounded-lg hover:bg-stone-100 text-stone-600">
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button onClick={() => onDelete(r.id)} className="p-2 rounded-lg hover:bg-rose-50 text-rose-600">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

/* ============================================================
   BUDGETS PAGE
   ============================================================ */

function BudgetsPage({ budgets, txs, fx, onAdd, onEdit, onDelete }) {
  const now = new Date();
  const monthStart = toDateStr(new Date(now.getFullYear(), now.getMonth(), 1));
  const monthEnd = toDateStr(new Date(now.getFullYear(), now.getMonth() + 1, 0));

  const spendByCat = useMemo(() => {
    const m = new Map();
    for (const t of txs) {
      if (t.type !== 'gider') continue;
      if (cmpDate(t.date, monthStart) < 0 || cmpDate(t.date, monthEnd) > 0) continue;
      const trySum = t.amountTRY != null ? t.amountTRY : convertToTRY(t.amount, t.currency, fx.rates);
      m.set(t.category, (m.get(t.category) || 0) + trySum);
    }
    return m;
  }, [txs, monthStart, monthEnd, fx]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-stone-800">Aylık Bütçe Hedefleri</h2>
        <button onClick={onAdd} className="px-3 py-1.5 rounded-full bg-amber-600 text-white text-sm flex items-center gap-1.5">
          <Plus className="w-4 h-4" /> Hedef
        </button>
      </div>

      {budgets.length === 0 ? (
        <EmptyState text="Kategoriler için aylık harcama hedefi belirle." />
      ) : (
        <ul className="space-y-2">
          {budgets.map(g => {
            const cat = getCat('gider', g.category);
            const spent = spendByCat.get(g.category) || 0;
            const pct = g.limit > 0 ? Math.min(100, (spent / g.limit) * 100) : 0;
            const over = spent > g.limit;
            return (
              <li key={g.id} className="bg-white rounded-2xl border border-stone-200 p-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-stone-100 text-stone-700 flex items-center justify-center">
                    <cat.Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-stone-800">{cat.label}</div>
                    <div className="text-xs text-stone-500">
                      {formatMoney(spent, 'TRY')} / {formatMoney(g.limit, 'TRY')}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => onEdit(g)} className="p-2 rounded-lg hover:bg-stone-100 text-stone-600">
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button onClick={() => onDelete(g.id)} className="p-2 rounded-lg hover:bg-rose-50 text-rose-600">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="mt-3 h-2 bg-stone-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${over ? 'bg-rose-500' : pct > 80 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                {over && (
                  <div className="mt-2 text-xs text-rose-700 flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" /> Hedef aşıldı
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

/* ============================================================
   CARD CYCLE PAGE
   ============================================================ */

function CardCyclePage({ accountId, accounts, txs, fx, onBack }) {
  const card = getAccount(accounts, accountId);
  const [offset, setOffset] = useState(0);

  if (!card || card.type !== 'kredi_karti') {
    return (
      <div>
        <button onClick={onBack} className="text-sm text-amber-700 flex items-center gap-1"><ChevronLeft className="w-4 h-4" /> Geri</button>
        <EmptyState text="Hesap bulunamadı." />
      </div>
    );
  }
  if (!card.cutoffDay) {
    return (
      <div className="space-y-4">
        <button onClick={onBack} className="text-sm text-amber-700 flex items-center gap-1"><ChevronLeft className="w-4 h-4" /> Geri</button>
        <EmptyState text="Bu kart için kesim günü tanımlı değil. Hesap detayından ekleyin." />
      </div>
    );
  }

  const cycle = getCycleByOffset(card, offset);
  const cycleTxs = useMemo(() => txs.filter(t => t.accountId === card.id && txInCycle(t, cycle)), [txs, card.id, cycle]);
  const totalSpent = cycleTxs
    .filter(t => t.type === 'gider')
    .reduce((s, t) => s + t.amount, 0);
  const totalPaid = cycleTxs
    .filter(t => t.type === 'gelir')
    .reduce((s, t) => s + t.amount, 0);

  return (
    <div className="space-y-4">
      <button onClick={onBack} className="text-sm text-amber-700 flex items-center gap-1"><ChevronLeft className="w-4 h-4" /> Hesaplar</button>

      <div className="bg-white rounded-2xl border border-stone-200 p-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: card.color + '20', color: card.color }}>
            <CreditCard className="w-5 h-5" />
          </div>
          <div>
            <div className="font-semibold text-stone-800">{card.name}</div>
            <div className="text-xs text-stone-500">Kesim {card.cutoffDay}. gün · {card.currency}</div>
          </div>
          <div className="ml-auto flex items-center gap-1">
            <button onClick={() => setOffset(o => o - 1)} className="p-1.5 rounded hover:bg-stone-100"><ChevronLeft className="w-4 h-4" /></button>
            <div className="text-sm font-medium px-1">{cycle.label}</div>
            <button onClick={() => setOffset(o => o + 1)} className="p-1.5 rounded hover:bg-stone-100"><ChevronRight className="w-4 h-4" /></button>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2 text-center">
          <div>
            <div className="text-[10px] uppercase tracking-wide text-stone-500">Harcama</div>
            <div className="font-semibold text-rose-700">{formatMoney(totalSpent, card.currency)}</div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-wide text-stone-500">Ödeme</div>
            <div className="font-semibold text-emerald-700">{formatMoney(totalPaid, card.currency)}</div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-wide text-stone-500">Bakiye</div>
            <div className="font-semibold text-stone-800">{formatMoney(totalSpent - totalPaid, card.currency)}</div>
          </div>
        </div>

        <div className="mt-3 text-xs text-stone-500">
          Dönem: {formatDateShort(cycle.start)} – {formatDateShort(cycle.end)}
          {cycle.dueDate && <> · Son ödeme: {formatDateLong(cycle.dueDate)}</>}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
        {cycleTxs.length === 0 ? (
          <div className="text-sm text-stone-500 py-8 text-center">Bu dönemde işlem yok.</div>
        ) : (
          <ul className="divide-y divide-stone-100">
            {cycleTxs.sort((a, b) => cmpDate(b.date, a.date)).map(t => (
              <li key={t.id} className="px-4 py-2.5 flex items-center gap-3">
                <TxRow tx={t} accounts={accounts} expanded />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

/* ============================================================
   SETTINGS PAGE
   ============================================================ */

function SettingsPage({ fx, onRefresh, onManual }) {
  const [usd, setUsd] = useState(fx.rates.USD?.toFixed(4) || '');
  const [eur, setEur] = useState(fx.rates.EUR?.toFixed(4) || '');

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-stone-800">Ayarlar</h2>

      <div className="bg-white rounded-2xl border border-stone-200 p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Globe className="w-4 h-4 text-stone-500" />
          <div className="font-medium text-stone-800">Döviz Kurları</div>
        </div>
        <div className="text-xs text-stone-500">
          Kaynak: {fx.source} · Güncelleme: {relativeTime(fx.fetchedAt)}
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs text-stone-500">USD → TRY</label>
            <input className="mt-1 w-full px-3 py-2 rounded-lg border border-stone-200 text-sm" value={usd} onChange={e => setUsd(e.target.value)} />
          </div>
          <div>
            <label className="text-xs text-stone-500">EUR → TRY</label>
            <input className="mt-1 w-full px-3 py-2 rounded-lg border border-stone-200 text-sm" value={eur} onChange={e => setEur(e.target.value)} />
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={onRefresh} className="flex-1 px-3 py-2 rounded-lg bg-stone-100 hover:bg-stone-200 text-sm flex items-center justify-center gap-1.5">
            <RefreshCw className="w-4 h-4" /> Otomatik güncelle
          </button>
          <button
            onClick={() => onManual({ USD: parseFloat(usd) || 0, EUR: parseFloat(eur) || 0 })}
            className="flex-1 px-3 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-sm flex items-center justify-center gap-1.5"
          >
            <Check className="w-4 h-4" /> Manuel kaydet
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-stone-200 p-4 text-xs text-stone-600 space-y-2">
        <div className="font-medium text-stone-800 text-sm">Veri</div>
        <p>Veriler tarayıcı saklama alanında tutulur. Tarayıcı verilerini temizlemek geçmişi silebilir.</p>
      </div>
    </div>
  );
}

/* ============================================================
   MODALS
   ============================================================ */

function ModalShell({ title, onClose, children, footer }) {
  return (
    <div className="fixed inset-0 z-40 bg-black/30 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="w-full max-w-md bg-white rounded-t-3xl sm:rounded-2xl shadow-xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-stone-200">
          <div className="font-semibold text-stone-800">{title}</div>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-stone-100"><X className="w-4 h-4" /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-3">{children}</div>
        {footer && <div className="p-4 border-t border-stone-200">{footer}</div>}
      </div>
    </div>
  );
}

function Field({ label, children, hint }) {
  return (
    <div>
      <label className="text-xs font-medium text-stone-600">{label}</label>
      <div className="mt-1">{children}</div>
      {hint && <div className="text-[11px] text-stone-500 mt-1">{hint}</div>}
    </div>
  );
}

function TxModal({ tx, accounts, fx, onClose, onSave, onDelete }) {
  const editing = !!tx;
  const [type, setType] = useState(tx?.type || 'gider');
  const [accountId, setAccountId] = useState(tx?.accountId || accounts[0]?.id || '');
  const [category, setCategory] = useState(tx?.category || (type === 'gelir' ? 'maas' : 'market'));
  const [amount, setAmount] = useState(tx?.amount?.toString() || '');
  const [currency, setCurrency] = useState(tx?.currency || (accounts[0]?.currency || 'TRY'));
  const [date, setDate] = useState(tx?.date || todayStr());
  const [note, setNote] = useState(tx?.note || '');

  useEffect(() => {
    // Default category when type flips
    if (!CATS[type].some(c => c.id === category)) {
      setCategory(type === 'gelir' ? 'maas' : 'market');
    }
  }, [type]); // eslint-disable-line

  // When account changes, default currency to that account's currency for new tx
  useEffect(() => {
    if (!editing) {
      const acc = getAccount(accounts, accountId);
      if (acc) setCurrency(acc.currency);
    }
  }, [accountId, editing, accounts]);

  const save = () => {
    const amt = parseFloat(amount);
    if (!accountId || !amt || amt <= 0) return;
    const fxRate = currency === 'TRY' ? 1 : (fx.rates[currency] || 0);
    const next = {
      id: tx?.id || uid('tx'),
      type,
      accountId,
      category,
      amount: amt,
      currency,
      fxRate,
      amountTRY: amt * fxRate,
      date,
      note: note.trim(),
      source: tx?.source || 'manual',
      sourceId: tx?.sourceId,
      transferId: tx?.transferId,
      createdAt: tx?.createdAt || Date.now(),
    };
    onSave(next);
  };

  const cats = CATS[type];

  return (
    <ModalShell
      title={editing ? 'İşlemi düzenle' : 'Yeni işlem'}
      onClose={onClose}
      footer={
        <div className="flex gap-2">
          {editing && onDelete && (
            <button onClick={onDelete} className="px-3 py-2 rounded-lg bg-rose-50 text-rose-700 text-sm flex items-center gap-1">
              <Trash2 className="w-4 h-4" /> Sil
            </button>
          )}
          <button onClick={onClose} className="ml-auto px-3 py-2 rounded-lg bg-stone-100 text-sm">Vazgeç</button>
          <button onClick={save} className="px-4 py-2 rounded-lg bg-amber-600 text-white text-sm">Kaydet</button>
        </div>
      }
    >
      <div className="grid grid-cols-2 gap-2">
        <button onClick={() => setType('gider')} className={`py-2 rounded-lg text-sm font-medium ${type === 'gider' ? 'bg-rose-100 text-rose-700' : 'bg-stone-100 text-stone-600'}`}>Gider</button>
        <button onClick={() => setType('gelir')} className={`py-2 rounded-lg text-sm font-medium ${type === 'gelir' ? 'bg-emerald-100 text-emerald-700' : 'bg-stone-100 text-stone-600'}`}>Gelir</button>
      </div>

      <Field label="Hesap">
        <select value={accountId} onChange={(e) => setAccountId(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-stone-200 text-sm">
          {accounts.map(a => <option key={a.id} value={a.id}>{a.name} ({a.currency})</option>)}
        </select>
      </Field>

      <Field label="Kategori">
        <div className="grid grid-cols-4 gap-2">
          {cats.map(c => (
            <button
              key={c.id}
              onClick={() => setCategory(c.id)}
              className={`p-2 rounded-lg flex flex-col items-center gap-1 text-[11px] ${category === c.id ? 'bg-amber-100 text-amber-700' : 'bg-stone-100 text-stone-600'}`}
            >
              <c.Icon className="w-4 h-4" />
              <span className="truncate w-full text-center">{c.label}</span>
            </button>
          ))}
        </div>
      </Field>

      <div className="grid grid-cols-3 gap-2">
        <Field label="Tutar">
          <input
            type="number"
            inputMode="decimal"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-stone-200 text-sm"
            placeholder="0,00"
          />
        </Field>
        <Field label="Para birimi">
          <select value={currency} onChange={(e) => setCurrency(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-stone-200 text-sm">
            {CURRENCY_LIST.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </Field>
        <Field label="Tarih">
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-stone-200 text-sm" />
        </Field>
      </div>

      <Field label="Açıklama (opsiyonel)">
        <input value={note} onChange={(e) => setNote(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-stone-200 text-sm" placeholder="Örn. Migros alışveriş" />
      </Field>

      {currency !== 'TRY' && amount && (
        <div className="text-xs text-stone-500 bg-stone-50 rounded-lg p-2">
          ≈ {formatMoney((parseFloat(amount) || 0) * (fx.rates[currency] || 0), 'TRY')} (kur: {formatNum(fx.rates[currency] || 0, 4)})
        </div>
      )}
    </ModalShell>
  );
}

function AccountModal({ account, onClose, onSave }) {
  const editing = !!account;
  const [name, setName] = useState(account?.name || '');
  const [type, setType] = useState(account?.type || 'banka');
  const [currency, setCurrency] = useState(account?.currency || 'TRY');
  const [color, setColor] = useState(account?.color || ACCOUNT_COLORS[0]);
  const [initialBalance, setInitialBalance] = useState(account?.initialBalance?.toString() || '0');
  const [cutoffDay, setCutoffDay] = useState(account?.cutoffDay?.toString() || '1');
  const [paymentDueDay, setPaymentDueDay] = useState(account?.paymentDueDay?.toString() || '');
  const [creditLimit, setCreditLimit] = useState(account?.creditLimit?.toString() || '');

  const save = () => {
    if (!name.trim()) return;
    const next = {
      id: account?.id || uid('acc'),
      name: name.trim(),
      type,
      currency,
      color,
      initialBalance: parseFloat(initialBalance) || 0,
      archived: account?.archived || false,
      createdAt: account?.createdAt || Date.now(),
    };
    if (type === 'kredi_karti') {
      next.cutoffDay = Math.max(1, Math.min(28, parseInt(cutoffDay, 10) || 1));
      if (paymentDueDay) next.paymentDueDay = Math.max(1, Math.min(28, parseInt(paymentDueDay, 10) || 1));
      if (creditLimit) next.creditLimit = parseFloat(creditLimit) || 0;
    }
    onSave(next);
  };

  return (
    <ModalShell
      title={editing ? 'Hesabı düzenle' : 'Yeni hesap'}
      onClose={onClose}
      footer={
        <div className="flex gap-2">
          <button onClick={onClose} className="ml-auto px-3 py-2 rounded-lg bg-stone-100 text-sm">Vazgeç</button>
          <button onClick={save} className="px-4 py-2 rounded-lg bg-amber-600 text-white text-sm">Kaydet</button>
        </div>
      }
    >
      <Field label="Ad">
        <input value={name} onChange={e => setName(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-stone-200 text-sm" />
      </Field>

      <Field label="Tür">
        <div className="grid grid-cols-3 gap-2">
          {Object.entries(ACCOUNT_TYPES).map(([id, info]) => (
            <button
              key={id}
              onClick={() => setType(id)}
              className={`p-2 rounded-lg flex flex-col items-center gap-1 text-xs ${type === id ? 'bg-amber-100 text-amber-700' : 'bg-stone-100 text-stone-600'}`}
            >
              <info.Icon className="w-4 h-4" />
              <span>{info.label}</span>
            </button>
          ))}
        </div>
      </Field>

      <div className="grid grid-cols-2 gap-2">
        <Field label="Para birimi">
          <select value={currency} onChange={e => setCurrency(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-stone-200 text-sm">
            {CURRENCY_LIST.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </Field>
        <Field label="Başlangıç bakiyesi">
          <input type="number" step="0.01" value={initialBalance} onChange={e => setInitialBalance(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-stone-200 text-sm" />
        </Field>
      </div>

      {type === 'kredi_karti' && (
        <div className="grid grid-cols-3 gap-2">
          <Field label="Kesim günü" hint="1–28">
            <input type="number" min="1" max="28" value={cutoffDay} onChange={e => setCutoffDay(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-stone-200 text-sm" />
          </Field>
          <Field label="Son ödeme günü">
            <input type="number" min="1" max="28" value={paymentDueDay} onChange={e => setPaymentDueDay(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-stone-200 text-sm" />
          </Field>
          <Field label="Limit">
            <input type="number" step="100" value={creditLimit} onChange={e => setCreditLimit(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-stone-200 text-sm" />
          </Field>
        </div>
      )}

      <Field label="Renk">
        <div className="flex gap-2 flex-wrap">
          {ACCOUNT_COLORS.map(c => (
            <button
              key={c}
              onClick={() => setColor(c)}
              className={`w-7 h-7 rounded-full border-2 ${color === c ? 'border-stone-800' : 'border-transparent'}`}
              style={{ background: c }}
            />
          ))}
        </div>
      </Field>
    </ModalShell>
  );
}

function TransferModal({ accounts, onClose, onSave }) {
  const [fromId, setFromId] = useState(accounts[0]?.id || '');
  const [toId, setToId] = useState(accounts[1]?.id || accounts[0]?.id || '');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(todayStr());
  const [note, setNote] = useState('');

  const save = () => {
    const amt = parseFloat(amount);
    if (!fromId || !toId || fromId === toId || !amt || amt <= 0) return;
    onSave({ fromId, toId, amount: amt, date, note: note.trim() });
  };

  return (
    <ModalShell
      title="Hesaplar arası transfer"
      onClose={onClose}
      footer={
        <div className="flex gap-2">
          <button onClick={onClose} className="ml-auto px-3 py-2 rounded-lg bg-stone-100 text-sm">Vazgeç</button>
          <button onClick={save} className="px-4 py-2 rounded-lg bg-amber-600 text-white text-sm">Aktar</button>
        </div>
      }
    >
      <Field label="Kaynak hesap">
        <select value={fromId} onChange={e => setFromId(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-stone-200 text-sm">
          {accounts.map(a => <option key={a.id} value={a.id}>{a.name} ({a.currency})</option>)}
        </select>
      </Field>
      <Field label="Hedef hesap">
        <select value={toId} onChange={e => setToId(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-stone-200 text-sm">
          {accounts.filter(a => a.id !== fromId).map(a => <option key={a.id} value={a.id}>{a.name} ({a.currency})</option>)}
        </select>
      </Field>
      <div className="grid grid-cols-2 gap-2">
        <Field label="Tutar (kaynak para biriminde)">
          <input type="number" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-stone-200 text-sm" />
        </Field>
        <Field label="Tarih">
          <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-stone-200 text-sm" />
        </Field>
      </div>
      <Field label="Açıklama (opsiyonel)">
        <input value={note} onChange={e => setNote(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-stone-200 text-sm" />
      </Field>
    </ModalShell>
  );
}

function RecurringModal({ rule, accounts, onClose, onSave }) {
  const editing = !!rule;
  const [name, setName] = useState(rule?.name || '');
  const [type, setType] = useState(rule?.type || 'gider');
  const [accountId, setAccountId] = useState(rule?.accountId || accounts[0]?.id || '');
  const [category, setCategory] = useState(rule?.category || (type === 'gelir' ? 'maas' : 'fatura'));
  const [amount, setAmount] = useState(rule?.amount?.toString() || '');
  const [currency, setCurrency] = useState(rule?.currency || 'TRY');
  const [frequency, setFrequency] = useState(rule?.frequency || 'aylik');
  const [dayOfMonth, setDayOfMonth] = useState(rule?.dayOfMonth?.toString() || '1');
  const [dayOfWeek, setDayOfWeek] = useState(rule?.dayOfWeek ?? 1);
  const [monthOfYear, setMonthOfYear] = useState(rule?.monthOfYear?.toString() || '1');
  const [startDate, setStartDate] = useState(rule?.startDate || todayStr());
  const [endDate, setEndDate] = useState(rule?.endDate || '');
  const [active, setActive] = useState(rule?.active ?? true);

  const save = () => {
    if (!name.trim() || !accountId) return;
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) return;
    const next = {
      id: rule?.id || uid('rec'),
      name: name.trim(),
      type,
      accountId,
      category,
      amount: amt,
      currency,
      frequency,
      startDate,
      endDate: endDate || null,
      active,
      exceptions: rule?.exceptions || [],
      lastGeneratedDate: rule?.lastGeneratedDate || null,
      createdAt: rule?.createdAt || Date.now(),
    };
    if (frequency === 'aylik') next.dayOfMonth = Math.max(1, Math.min(31, parseInt(dayOfMonth, 10) || 1));
    if (frequency === 'haftalik') next.dayOfWeek = parseInt(dayOfWeek, 10);
    if (frequency === 'yillik') {
      next.dayOfMonth = Math.max(1, Math.min(31, parseInt(dayOfMonth, 10) || 1));
      next.monthOfYear = Math.max(1, Math.min(12, parseInt(monthOfYear, 10) || 1));
    }
    onSave(next);
  };

  const cats = CATS[type];

  return (
    <ModalShell
      title={editing ? 'Tekrarı düzenle' : 'Yeni tekrar'}
      onClose={onClose}
      footer={
        <div className="flex gap-2">
          <button onClick={onClose} className="ml-auto px-3 py-2 rounded-lg bg-stone-100 text-sm">Vazgeç</button>
          <button onClick={save} className="px-4 py-2 rounded-lg bg-amber-600 text-white text-sm">Kaydet</button>
        </div>
      }
    >
      <Field label="Ad">
        <input value={name} onChange={e => setName(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-stone-200 text-sm" placeholder="Örn. Kira, Spotify, Maaş" />
      </Field>

      <div className="grid grid-cols-2 gap-2">
        <button onClick={() => setType('gider')} className={`py-2 rounded-lg text-sm font-medium ${type === 'gider' ? 'bg-rose-100 text-rose-700' : 'bg-stone-100 text-stone-600'}`}>Gider</button>
        <button onClick={() => setType('gelir')} className={`py-2 rounded-lg text-sm font-medium ${type === 'gelir' ? 'bg-emerald-100 text-emerald-700' : 'bg-stone-100 text-stone-600'}`}>Gelir</button>
      </div>

      <Field label="Hesap">
        <select value={accountId} onChange={e => setAccountId(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-stone-200 text-sm">
          {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
        </select>
      </Field>

      <Field label="Kategori">
        <select value={category} onChange={e => setCategory(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-stone-200 text-sm">
          {cats.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
        </select>
      </Field>

      <div className="grid grid-cols-2 gap-2">
        <Field label="Tutar">
          <input type="number" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-stone-200 text-sm" />
        </Field>
        <Field label="Para birimi">
          <select value={currency} onChange={e => setCurrency(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-stone-200 text-sm">
            {CURRENCY_LIST.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </Field>
      </div>

      <Field label="Sıklık">
        <div className="grid grid-cols-3 gap-2">
          {Object.entries(FREQUENCIES).map(([id, info]) => (
            <button key={id} onClick={() => setFrequency(id)} className={`py-2 rounded-lg text-sm ${frequency === id ? 'bg-amber-100 text-amber-700' : 'bg-stone-100 text-stone-600'}`}>
              {info.label}
            </button>
          ))}
        </div>
      </Field>

      {frequency === 'aylik' && (
        <Field label="Ayın günü" hint="1–31 (kısa aylar son güne kırpılır)">
          <input type="number" min="1" max="31" value={dayOfMonth} onChange={e => setDayOfMonth(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-stone-200 text-sm" />
        </Field>
      )}
      {frequency === 'haftalik' && (
        <Field label="Haftanın günü">
          <select value={dayOfWeek} onChange={e => setDayOfWeek(parseInt(e.target.value, 10))} className="w-full px-3 py-2 rounded-lg border border-stone-200 text-sm">
            {WEEKDAYS.map(w => <option key={w.id} value={w.id}>{w.full}</option>)}
          </select>
        </Field>
      )}
      {frequency === 'yillik' && (
        <div className="grid grid-cols-2 gap-2">
          <Field label="Gün">
            <input type="number" min="1" max="31" value={dayOfMonth} onChange={e => setDayOfMonth(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-stone-200 text-sm" />
          </Field>
          <Field label="Ay">
            <select value={monthOfYear} onChange={e => setMonthOfYear(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-stone-200 text-sm">
              {AYLAR.map((a, i) => <option key={i} value={i + 1}>{a}</option>)}
            </select>
          </Field>
        </div>
      )}

      <div className="grid grid-cols-2 gap-2">
        <Field label="Başlangıç">
          <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-stone-200 text-sm" />
        </Field>
        <Field label="Bitiş (opsiyonel)">
          <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-stone-200 text-sm" />
        </Field>
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={active} onChange={e => setActive(e.target.checked)} />
        Aktif
      </label>
    </ModalShell>
  );
}

function BudgetModal({ goal, onClose, onSave }) {
  const editing = !!goal;
  const [category, setCategory] = useState(goal?.category || 'market');
  const [limit, setLimit] = useState(goal?.limit?.toString() || '');

  const save = () => {
    const amt = parseFloat(limit);
    if (!amt || amt <= 0) return;
    onSave({
      id: goal?.id || uid('bud'),
      category,
      limit: amt,
      createdAt: goal?.createdAt || Date.now(),
    });
  };

  return (
    <ModalShell
      title={editing ? 'Hedefi düzenle' : 'Yeni bütçe hedefi'}
      onClose={onClose}
      footer={
        <div className="flex gap-2">
          <button onClick={onClose} className="ml-auto px-3 py-2 rounded-lg bg-stone-100 text-sm">Vazgeç</button>
          <button onClick={save} className="px-4 py-2 rounded-lg bg-amber-600 text-white text-sm">Kaydet</button>
        </div>
      }
    >
      <Field label="Kategori">
        <select value={category} onChange={e => setCategory(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-stone-200 text-sm">
          {CATS.gider.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
        </select>
      </Field>
      <Field label="Aylık limit (TRY)">
        <input type="number" step="10" value={limit} onChange={e => setLimit(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-stone-200 text-sm" placeholder="Örn. 4000" />
      </Field>
    </ModalShell>
  );
}

/* ============================================================
   SMALL UI
   ============================================================ */

function Pill({ active, onClick, tone, children }) {
  const toneClass = !active ? 'bg-stone-100 text-stone-600' :
    tone === 'emerald' ? 'bg-emerald-100 text-emerald-700' :
    tone === 'rose' ? 'bg-rose-100 text-rose-700' :
    'bg-amber-100 text-amber-700';
  return (
    <button onClick={onClick} className={`px-3 py-1 rounded-full text-xs font-medium ${toneClass}`}>
      {children}
    </button>
  );
}

function EmptyState({ text }) {
  return (
    <div className="bg-white rounded-2xl border border-dashed border-stone-300 p-10 text-center text-sm text-stone-500">
      {text}
    </div>
  );
}
