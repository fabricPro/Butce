// Centralized transaction predicates so the same logic stays consistent
// across every aggregation in the app.

import { cmpDate } from './date.js';

/** A "settled" transaction is one that affects the actual balance.
 *  Pending transactions (status === 'pending') are explicitly excluded. */
export function isSettled(tx) {
  return tx.status !== 'pending';
}

export function inAccount(tx, accountId) {
  return tx.accountId === accountId;
}

/** Inclusive on both ends. */
export function inDateRange(tx, startDate, endDate) {
  return cmpDate(tx.date, startDate) >= 0 && cmpDate(tx.date, endDate) <= 0;
}

export function isOnOrBefore(tx, asOfDate) {
  return !asOfDate || cmpDate(tx.date, asOfDate) <= 0;
}
