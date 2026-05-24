import { describe, it, expect } from 'vitest';
import { formatNum, formatMoney, convertToTRY } from '../format.js';

describe('formatters', () => {
  it('formatNum uses Turkish locale', () => {
    expect(formatNum(1234.5)).toBe('1.234,50');
    expect(formatNum(-99.99)).toBe('99,99');                 // absolute value
  });

  it('formatNum respects digits param', () => {
    expect(formatNum(1234, 0)).toBe('1.234');
  });

  it('formatMoney TRY appends ₺', () => {
    expect(formatMoney(1500, 'TRY')).toBe('1.500,00 ₺');
  });

  it('formatMoney negative gets a minus sign', () => {
    expect(formatMoney(-200, 'TRY')).toBe('−200,00 ₺');
  });

  it('formatMoney signed mode adds + for positives', () => {
    expect(formatMoney(50, 'TRY', true)).toBe('+50,00 ₺');
    expect(formatMoney(0, 'TRY', true)).toBe('0,00 ₺');
  });

  it('formatMoney USD prefixes $', () => {
    expect(formatMoney(100, 'USD')).toBe('$100,00');
  });

  it('convertToTRY is identity for TRY', () => {
    expect(convertToTRY(500, 'TRY', { TRY: 1, USD: 30 })).toBe(500);
  });

  it('convertToTRY multiplies by FX rate', () => {
    expect(convertToTRY(10, 'USD', { TRY: 1, USD: 30 })).toBe(300);
  });
});
