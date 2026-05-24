import { uid, AYLAR, WEEKDAYS } from '../constants.js';
import {
  parseDate, toDateStr, daysInMonth, addDays, cmpDate, todayStr,
} from './date.js';

export function nextOccurrence(rule, fromDateStr) {
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
    const candidate = new Date(cursor);
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

export function generateBetween(rule, startDateStr, endDateStr) {
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

export function materializeRules(rules, accounts, fxRates) {
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

export function describeFrequency(rule) {
  if (rule.frequency === 'aylik') return `Her ayın ${rule.dayOfMonth}'i`;
  if (rule.frequency === 'haftalik') return `Her ${WEEKDAYS.find(w => w.id === rule.dayOfWeek)?.full || ''}`;
  if (rule.frequency === 'yillik') return `Her yıl ${rule.dayOfMonth} ${AYLAR[rule.monthOfYear - 1]}`;
  return '';
}
