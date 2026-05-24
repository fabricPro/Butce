import { describe, it, expect } from 'vitest';
import {
  getAccountNativeBalance, getAccountBalanceTRY, getSettledBalanceTRY,
} from '../balance.js';

const TRY_ACC = { id: 'a1', currency: 'TRY', initialBalance: 1000 };
const USD_ACC = { id: 'a2', currency: 'USD', initialBalance: 100 };
const FX = { TRY: 1, USD: 30, EUR: 35 };

const tx = (over) => ({
  id: 't', accountId: 'a1', type: 'gider', amount: 100, status: 'paid', date: '2026-01-15',
  ...over,
});

describe('balance', () => {
  it('initialBalance is the baseline when no tx', () => {
    expect(getAccountNativeBalance(TRY_ACC, [])).toBe(1000);
  });

  it('gelir adds, gider subtracts', () => {
    expect(getAccountNativeBalance(TRY_ACC, [tx({ type: 'gelir', amount: 200 })])).toBe(1200);
    expect(getAccountNativeBalance(TRY_ACC, [tx({ type: 'gider', amount: 300 })])).toBe(700);
  });

  it('pending transactions are excluded', () => {
    const pending = tx({ type: 'gider', amount: 500, status: 'pending' });
    const paid = tx({ type: 'gider', amount: 100, id: 't2' });
    expect(getAccountNativeBalance(TRY_ACC, [pending, paid])).toBe(900); // only -100 applies
  });

  it('asOfDate caps which transactions count', () => {
    const past = tx({ amount: 100, date: '2026-01-10' });
    const future = tx({ amount: 500, id: 't2', date: '2026-03-15' });
    expect(getAccountNativeBalance(TRY_ACC, [past, future], '2026-02-01')).toBe(900);
  });

  it('transactions on other accounts are ignored', () => {
    const other = tx({ accountId: 'aX', amount: 9999 });
    expect(getAccountNativeBalance(TRY_ACC, [other])).toBe(1000);
  });

  it('getAccountBalanceTRY applies FX rate for non-TRY account', () => {
    expect(getAccountBalanceTRY(USD_ACC, [], FX)).toBe(3000);    // 100 USD × 30
  });

  it('getSettledBalanceTRY sums across accounts in TRY', () => {
    const tryTx = tx({ accountId: 'a1', type: 'gelir', amount: 500, date: '2026-01-01' });
    const usdTx = { ...tx({ accountId: 'a2', type: 'gider', amount: 50, date: '2026-01-01' }) };
    const total = getSettledBalanceTRY([TRY_ACC, USD_ACC], [tryTx, usdTx], FX, '2026-12-31');
    // a1: 1000 + 500 = 1500 TRY
    // a2: 100 - 50 = 50 USD × 30 = 1500 TRY
    expect(total).toBe(3000);
  });
});
