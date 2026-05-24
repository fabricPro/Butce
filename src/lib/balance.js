import { isSettled, inAccount, isOnOrBefore } from './predicates.js';

export function getAccountNativeBalance(account, txs, asOfDate = null) {
  let bal = account.initialBalance || 0;
  for (const t of txs) {
    if (!inAccount(t, account.id)) continue;
    if (!isSettled(t)) continue;
    if (!isOnOrBefore(t, asOfDate)) continue;
    bal += t.type === 'gelir' ? t.amount : -t.amount;
  }
  return bal;
}

export function getAccountBalanceTRY(account, txs, fxRates, asOfDate = null) {
  const native = getAccountNativeBalance(account, txs, asOfDate);
  const rate = account.currency === 'TRY' ? 1 : (fxRates[account.currency] || 0);
  return native * rate;
}

export function getSettledBalanceTRY(accounts, txs, fxRates, asOfDate) {
  let total = 0;
  for (const acc of accounts) {
    let native = acc.initialBalance || 0;
    for (const t of txs) {
      if (!inAccount(t, acc.id)) continue;
      if (!isSettled(t)) continue;
      if (!isOnOrBefore(t, asOfDate)) continue;
      native += t.type === 'gelir' ? t.amount : -t.amount;
    }
    const rate = acc.currency === 'TRY' ? 1 : (fxRates[acc.currency] || 0);
    total += native * rate;
  }
  return total;
}
