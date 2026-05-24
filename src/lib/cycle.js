import { AY_KISA, AYLAR } from '../constants.js';
import {
  parseDate, toDateStr, daysInMonth, todayStr, cmpDate,
} from './date.js';

function cycleObj(card, endDate, startDate) {
  const endY = endDate.getFullYear();
  const endM = endDate.getMonth();
  let dueDate = null;
  if (card.paymentDueDay) {
    const dueInSameMonth = card.paymentDueDay > (card.cutoffDay - 1);
    let dueY = endY, dueM = dueInSameMonth ? endM : endM + 1;
    if (dueM > 11) { dueM = 0; dueY += 1; }
    const dueDayClamped = Math.min(card.paymentDueDay, daysInMonth(dueY, dueM));
    dueDate = toDateStr(new Date(dueY, dueM, dueDayClamped));
  }
  return {
    start: toDateStr(startDate),
    end: toDateStr(endDate),
    endY, endM,
    label: `${AYLAR[endM]} ${endY}`,
    shortLabel: `${AY_KISA[endM]} ${String(endY).slice(2)}`,
    dueDate,
  };
}

export function getCycleForDate(card, dateStr) {
  const d = parseDate(dateStr);
  const day = d.getDate();
  let endY = d.getFullYear();
  let endM = d.getMonth();
  if (day >= card.cutoffDay) {
    endM += 1;
    if (endM > 11) { endM = 0; endY += 1; }
  }
  const endDate = new Date(endY, endM, card.cutoffDay - 1);
  const startDate = new Date(endY, endM - 1, card.cutoffDay);
  return cycleObj(card, endDate, startDate);
}

export function getCurrentCycle(card) {
  return getCycleForDate(card, todayStr());
}

export function getCycleByOffset(card, offset) {
  const current = getCurrentCycle(card);
  let endY = current.endY;
  let endM = current.endM + offset;
  while (endM < 0) { endM += 12; endY -= 1; }
  while (endM > 11) { endM -= 12; endY += 1; }
  const endDate = new Date(endY, endM, card.cutoffDay - 1);
  const startDate = new Date(endY, endM - 1, card.cutoffDay);
  return cycleObj(card, endDate, startDate);
}

export function txInCycle(tx, cycle) {
  return cmpDate(tx.date, cycle.start) >= 0 && cmpDate(tx.date, cycle.end) <= 0;
}
