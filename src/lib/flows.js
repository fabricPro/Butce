import { AY_KISA } from '../constants.js';
import { cmpDate, toDateStr, addDays, todayStr } from './date.js';
import { generateBetween } from './recurring.js';
import { getSettledBalanceTRY } from './balance.js';
import { convertToTRY } from './format.js';
import { isSettled, inDateRange } from './predicates.js';

export function forecastRecurringInRange(rules, accountId, startDateStr, endDateStr, fxRates) {
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

export function projectMonthlyFlows(months, accounts, txs, recurringRules, fxRates) {
  // months: [{y, m}, ...] (0-indexed month)
  return months.map(({ y, m }) => {
    const monthStart = toDateStr(new Date(y, m, 1));
    const monthEnd = toDateStr(new Date(y, m + 1, 0));
    let income = 0, expense = 0;
    let manualIn = 0, manualOut = 0;
    let forecastIn = 0, forecastOut = 0;

    // Already-recorded transactions (pending excluded)
    for (const t of txs) {
      if (!isSettled(t)) continue;
      if (!inDateRange(t, monthStart, monthEnd)) continue;
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

export function forecastBalanceTRY(accounts, txs, recurringRules, fxRates, asOfDate) {
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
