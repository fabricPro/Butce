import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, CreditCard, Check } from 'lucide-react';
import { getAccount } from '../constants.js';
import { cmpDate, formatDateShort, formatDateLong } from '../lib/date.js';
import { formatMoney } from '../lib/format.js';
import { getCycleByOffset, txInCycle } from '../lib/cycle.js';
import { isSettled } from '../lib/predicates.js';
import EmptyState from '../components/EmptyState.jsx';
import TxRow from '../components/TxRow.jsx';

export default function CardCyclePage({ accountId, accounts, txs, onBack, onPayCycle }) {
  const card = getAccount(accounts, accountId);
  const [offset, setOffset] = useState(0);

  // All hooks must run unconditionally before any early return.
  // For invalid cards, fall back to a dummy cycle that yields zero tx.
  const cycle = card?.cutoffDay ? getCycleByOffset(card, offset) : null;
  const cycleTxs = useMemo(() => {
    if (!card || !cycle) return [];
    return txs.filter(t => t.accountId === card.id && isSettled(t) && txInCycle(t, cycle));
  }, [txs, card, cycle]);

  if (!card || card.type !== 'kredi_karti') {
    return (
      <div>
        <button onClick={onBack} className="text-sm text-amber-700 flex items-center gap-1">
          <ChevronLeft className="w-4 h-4" /> Geri
        </button>
        <EmptyState text="Hesap bulunamadı." />
      </div>
    );
  }
  if (!card.cutoffDay) {
    return (
      <div className="space-y-4">
        <button onClick={onBack} className="text-sm text-amber-700 flex items-center gap-1">
          <ChevronLeft className="w-4 h-4" /> Geri
        </button>
        <EmptyState text="Bu kart için kesim günü tanımlı değil. Hesap detayından ekleyin." />
      </div>
    );
  }

  const totalSpent = cycleTxs.filter(t => t.type === 'gider').reduce((s, t) => s + t.amount, 0);
  const totalPaid = cycleTxs.filter(t => t.type === 'gelir').reduce((s, t) => s + t.amount, 0);
  const balance = totalSpent - totalPaid;

  return (
    <div className="space-y-4">
      <button onClick={onBack} className="text-sm text-amber-700 flex items-center gap-1">
        <ChevronLeft className="w-4 h-4" /> Hesaplar
      </button>

      <div className="bg-white rounded-2xl border border-stone-200 p-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: card.color + '20', color: card.color }}>
            <CreditCard className="w-5 h-5" />
          </div>
          <div>
            <div className="font-semibold text-stone-800">{card.name}</div>
            <div className="text-xs text-stone-500">Kesim {card.cutoffDay}. gün · {card.currency}</div>
          </div>
          <div className="ml-auto flex items-center gap-0.5">
            <button
              onClick={() => setOffset(o => o - 1)}
              className="min-h-[44px] min-w-[44px] rounded-lg hover:bg-stone-100 active:bg-stone-200 text-stone-600 inline-flex items-center justify-center"
              title="Önceki dönem"
              aria-label="Önceki dönem"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="text-sm font-medium px-1 tabular-nums">{cycle.label}</div>
            <button
              onClick={() => setOffset(o => o + 1)}
              className="min-h-[44px] min-w-[44px] rounded-lg hover:bg-stone-100 active:bg-stone-200 text-stone-600 inline-flex items-center justify-center"
              title="Sonraki dönem"
              aria-label="Sonraki dönem"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2 text-center">
          <div>
            <div className="text-[10px] uppercase tracking-wide text-stone-500">Harcama</div>
            <div className="font-semibold text-rose-700">{formatMoney(totalSpent, card.currency)}</div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-wide text-stone-500">Ödeme</div>
            <div className="font-semibold text-emerald-700">{formatMoney(totalPaid, card.currency)}</div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-wide text-stone-500">Bakiye</div>
            <div className="font-semibold text-stone-800">{formatMoney(balance, card.currency)}</div>
          </div>
        </div>

        <div className="mt-3 text-xs text-stone-500">
          Dönem: {formatDateShort(cycle.start)} – {formatDateShort(cycle.end)}
          {cycle.dueDate && <> · Son ödeme: {formatDateLong(cycle.dueDate)}</>}
        </div>

        {balance > 0 && (
          <button
            onClick={() => onPayCycle?.({
              toId: card.id,
              amount: Number(balance.toFixed(2)),
              note: `Kart ödemesi · ${cycle.label}`,
              title: `${card.name} — ekstreyi öde`,
            })}
            className="mt-4 w-full py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium flex items-center justify-center gap-2"
          >
            <Check className="w-4 h-4" />
            Bu ekstreyi öde ({formatMoney(balance, card.currency)})
          </button>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
        {cycleTxs.length === 0 ? (
          <div className="text-sm text-stone-500 py-8 text-center">Bu dönemde işlem yok.</div>
        ) : (
          <ul className="divide-y divide-stone-100">
            {cycleTxs.sort((a, b) => cmpDate(b.date, a.date)).map(t => (
              <li key={t.id} className="px-4 py-2.5 flex items-center gap-3">
                <TxRow tx={t} accounts={accounts} expanded />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
