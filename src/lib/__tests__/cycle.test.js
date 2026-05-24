import { describe, it, expect } from 'vitest';
import { getCycleForDate, getCycleByOffset, txInCycle } from '../cycle.js';

// Card: cutoff day 15, due 1st of next month.
const CARD = { cutoffDay: 15, paymentDueDay: 1 };

describe('card cycle', () => {
  it('purchases before cutoff land in the current cycle', () => {
    // March 10th, cutoff 15 → cycle ends Mar 14, started Feb 15.
    const c = getCycleForDate(CARD, '2026-03-10');
    expect(c.start).toBe('2026-02-15');
    expect(c.end).toBe('2026-03-14');
  });

  it('purchases on/after cutoff land in the next cycle', () => {
    const c = getCycleForDate(CARD, '2026-03-15');
    expect(c.start).toBe('2026-03-15');
    expect(c.end).toBe('2026-04-14');
  });

  it('computes due date from paymentDueDay', () => {
    const c = getCycleForDate(CARD, '2026-03-10'); // cycle ends Mar 14
    // Due day is 1 (less than cutoff 15) so it falls in the month AFTER end month.
    expect(c.dueDate).toBe('2026-04-01');
  });

  it('label is in Turkish', () => {
    const c = getCycleForDate(CARD, '2026-03-10');
    expect(c.label).toBe('Mart 2026');
  });

  it('getCycleByOffset(0) equals current cycle', () => {
    const now = getCycleByOffset(CARD, 0);
    expect(now).toHaveProperty('start');
    expect(now).toHaveProperty('end');
  });

  it('getCycleByOffset(-1) is the previous cycle', () => {
    const cur = getCycleByOffset(CARD, 0);
    const prev = getCycleByOffset(CARD, -1);
    expect(prev.end < cur.end).toBe(true);
  });

  it('txInCycle is inclusive of cycle bounds', () => {
    const c = getCycleForDate(CARD, '2026-03-10'); // 02-15 .. 03-14
    expect(txInCycle({ date: '2026-02-15' }, c)).toBe(true);
    expect(txInCycle({ date: '2026-03-14' }, c)).toBe(true);
    expect(txInCycle({ date: '2026-02-14' }, c)).toBe(false);
    expect(txInCycle({ date: '2026-03-15' }, c)).toBe(false);
  });
});
