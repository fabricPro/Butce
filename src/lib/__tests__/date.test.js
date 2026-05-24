import { describe, it, expect } from 'vitest';
import {
  parseDate, toDateStr, addDays, cmpDate, daysInMonth,
  formatDateShort, formatDateLong, todayStr,
} from '../date.js';

describe('date helpers', () => {
  it('parseDate + toDateStr round-trips', () => {
    expect(toDateStr(parseDate('2026-03-15'))).toBe('2026-03-15');
  });

  it('addDays handles month rollover', () => {
    expect(addDays('2026-01-31', 1)).toBe('2026-02-01');
    expect(addDays('2026-02-28', 1)).toBe('2026-03-01');
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
  });

  it('addDays handles negative offset', () => {
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28');
  });

  it('cmpDate compares ISO date strings correctly', () => {
    expect(cmpDate('2026-01-01', '2026-12-31')).toBeLessThan(0);
    expect(cmpDate('2026-06-15', '2026-06-15')).toBe(0);
    expect(cmpDate('2027-01-01', '2026-12-31')).toBeGreaterThan(0);
  });

  it('daysInMonth returns correct length per month', () => {
    expect(daysInMonth(2026, 0)).toBe(31);    // January
    expect(daysInMonth(2026, 1)).toBe(28);    // February (non-leap)
    expect(daysInMonth(2024, 1)).toBe(29);    // February (leap)
    expect(daysInMonth(2026, 3)).toBe(30);    // April
  });

  it('formatDateShort produces Turkish month abbreviation', () => {
    expect(formatDateShort('2026-03-05')).toBe('5 Mar');
    expect(formatDateShort('2026-12-31')).toBe('31 Ara');
  });

  it('formatDateLong includes year', () => {
    expect(formatDateLong('2026-05-24')).toBe('24 May 2026');
  });

  it('todayStr matches YYYY-MM-DD pattern', () => {
    expect(todayStr()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
