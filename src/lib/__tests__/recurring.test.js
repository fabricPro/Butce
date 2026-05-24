import { describe, it, expect } from 'vitest';
import { nextOccurrence, generateBetween, describeFrequency } from '../recurring.js';

describe('recurring engine', () => {
  describe('nextOccurrence — monthly', () => {
    const rule = { frequency: 'aylik', dayOfMonth: 15, startDate: '2026-01-01' };

    it('returns same month if cursor is before day', () => {
      expect(nextOccurrence(rule, '2026-03-10')).toBe('2026-03-15');
    });

    it('rolls to next month if cursor is past day', () => {
      expect(nextOccurrence(rule, '2026-03-20')).toBe('2026-04-15');
    });

    it('clamps to last day for short months', () => {
      const r = { frequency: 'aylik', dayOfMonth: 31, startDate: '2026-01-01' };
      expect(nextOccurrence(r, '2026-02-01')).toBe('2026-02-28');
    });

    it('respects startDate cutoff', () => {
      const r = { frequency: 'aylik', dayOfMonth: 1, startDate: '2026-06-01' };
      expect(nextOccurrence(r, '2026-01-01')).toBe('2026-06-01');
    });
  });

  describe('nextOccurrence — yearly', () => {
    const rule = { frequency: 'yillik', dayOfMonth: 15, monthOfYear: 6, startDate: '2026-01-01' };

    it('returns this year if cursor before date', () => {
      expect(nextOccurrence(rule, '2026-03-01')).toBe('2026-06-15');
    });

    it('rolls to next year if cursor after date', () => {
      expect(nextOccurrence(rule, '2026-07-01')).toBe('2027-06-15');
    });
  });

  describe('generateBetween', () => {
    const rule = { frequency: 'aylik', dayOfMonth: 1, startDate: '2026-01-01' };

    it('produces all monthly occurrences in range', () => {
      const dates = generateBetween(rule, '2026-01-01', '2026-04-30');
      expect(dates).toEqual(['2026-01-01', '2026-02-01', '2026-03-01', '2026-04-01']);
    });

    it('returns [] if start is past end', () => {
      expect(generateBetween(rule, '2026-04-01', '2026-01-01')).toEqual([]);
    });

    it('returns [] if rule produces no dates in range', () => {
      const r = { frequency: 'aylik', dayOfMonth: 15, startDate: '2027-01-01' };
      expect(generateBetween(r, '2026-01-01', '2026-12-31')).toEqual([]);
    });
  });

  describe('describeFrequency', () => {
    it('describes monthly rule', () => {
      expect(describeFrequency({ frequency: 'aylik', dayOfMonth: 5 }))
        .toBe('Her ayın 5\'i');
    });

    it('describes weekly rule', () => {
      expect(describeFrequency({ frequency: 'haftalik', dayOfWeek: 1 }))
        .toBe('Her Pazartesi');
    });

    it('describes yearly rule', () => {
      expect(describeFrequency({ frequency: 'yillik', dayOfMonth: 1, monthOfYear: 1 }))
        .toBe('Her yıl 1 Ocak');
    });
  });
});
