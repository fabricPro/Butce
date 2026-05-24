import { describe, it, expect } from 'vitest';
import { isSettled, inAccount, inDateRange, isOnOrBefore } from '../predicates.js';

describe('predicates', () => {
  it('isSettled excludes only pending', () => {
    expect(isSettled({ status: 'paid' })).toBe(true);
    expect(isSettled({ status: 'pending' })).toBe(false);
    expect(isSettled({})).toBe(true);                       // legacy rows default to paid
  });

  it('inAccount checks accountId', () => {
    expect(inAccount({ accountId: 'a1' }, 'a1')).toBe(true);
    expect(inAccount({ accountId: 'a1' }, 'a2')).toBe(false);
  });

  it('inDateRange is inclusive on both ends', () => {
    expect(inDateRange({ date: '2026-01-15' }, '2026-01-01', '2026-01-31')).toBe(true);
    expect(inDateRange({ date: '2026-01-01' }, '2026-01-01', '2026-01-31')).toBe(true);
    expect(inDateRange({ date: '2026-01-31' }, '2026-01-01', '2026-01-31')).toBe(true);
    expect(inDateRange({ date: '2025-12-31' }, '2026-01-01', '2026-01-31')).toBe(false);
    expect(inDateRange({ date: '2026-02-01' }, '2026-01-01', '2026-01-31')).toBe(false);
  });

  it('isOnOrBefore allows null asOfDate (=accept everything)', () => {
    expect(isOnOrBefore({ date: '2027-01-01' }, null)).toBe(true);
  });

  it('isOnOrBefore excludes future tx', () => {
    expect(isOnOrBefore({ date: '2026-12-31' }, '2026-06-01')).toBe(false);
    expect(isOnOrBefore({ date: '2026-06-01' }, '2026-06-01')).toBe(true);
  });
});
