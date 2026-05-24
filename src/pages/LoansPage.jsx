import { useMemo } from 'react';
import { Plus, Banknote, Pencil, Trash2, Check } from 'lucide-react';
import { getAccount } from '../constants.js';
import { todayStr, toDateStr, cmpDate, formatDateLong } from '../lib/date.js';
import { formatMoney } from '../lib/format.js';
import EmptyState from '../components/EmptyState.jsx';
import IconButton from '../components/IconButton.jsx';

export default function LoansPage({ loans, accounts, onAdd, onEdit, onDelete, onPay }) {
  const today = todayStr();

  const enriched = useMemo(() => loans.map(loan => {
    const remaining = loan.installmentCount - loan.installmentsPaid;
    const totalPaid = loan.installmentsPaid * loan.monthlyPayment;
    const remainingAmount = remaining * loan.monthlyPayment;
    let nextDue = null;
    if (remaining > 0) {
      const [y, m, d] = loan.firstPaymentDate.split('-').map(Number);
      const next = new Date(y, (m - 1) + loan.installmentsPaid, d);
      nextDue = toDateStr(next);
    }
    const overdue = nextDue && cmpDate(nextDue, today) < 0;
    const pct = loan.installmentCount > 0 ? (loan.installmentsPaid / loan.installmentCount) * 100 : 0;
    return { loan, remaining, totalPaid, remainingAmount, nextDue, overdue, pct };
  }), [loans, today]);

  const totals = useMemo(() => {
    let monthly = 0, remaining = 0;
    for (const { loan, remainingAmount } of enriched) {
      if (loan.installmentsPaid < loan.installmentCount) monthly += loan.monthlyPayment;
      remaining += remainingAmount;
    }
    return { monthly, remaining };
  }, [enriched]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-stone-800">Krediler</h2>
        <button onClick={onAdd} className="min-h-[40px] px-3.5 rounded-full bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white text-sm flex items-center gap-1.5 transition-colors">
          <Plus className="w-4 h-4" /> Kredi
        </button>
      </div>

      {loans.length > 0 && (
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white rounded-2xl border border-stone-200 p-4">
            <div className="text-xs uppercase tracking-wide text-stone-500">Aylık yük</div>
            <div className="text-lg font-semibold text-rose-700 mt-1">{formatMoney(totals.monthly, 'TRY')}</div>
          </div>
          <div className="bg-white rounded-2xl border border-stone-200 p-4">
            <div className="text-xs uppercase tracking-wide text-stone-500">Kalan toplam</div>
            <div className="text-lg font-semibold text-stone-800 mt-1">{formatMoney(totals.remaining, 'TRY')}</div>
          </div>
        </div>
      )}

      {loans.length === 0 ? (
        <EmptyState text="Henüz kredi eklenmedi. Konut, taşıt, ihtiyaç vs. kredilerini takip etmek için ekle." />
      ) : (
        <ul className="space-y-2">
          {enriched.map(({ loan, totalPaid, remainingAmount, nextDue, overdue, pct }) => {
            const acc = getAccount(accounts, loan.accountId);
            const done = loan.installmentsPaid >= loan.installmentCount;
            return (
              <li key={loan.id} className="bg-white rounded-2xl border border-stone-200 p-4">
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${done ? 'bg-emerald-100 text-emerald-700' : 'bg-violet-100 text-violet-700'}`}>
                    <Banknote className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-stone-800 truncate">{loan.name}</div>
                    <div className="text-xs text-stone-500">
                      {loan.lender && <>{loan.lender} · </>}
                      {acc?.name || 'Hesap silinmiş'} · Taksit {formatMoney(loan.monthlyPayment, loan.currency)}
                    </div>
                    {nextDue && !done && (
                      <div className={`text-xs mt-0.5 ${overdue ? 'text-rose-700 font-medium' : 'text-stone-600'}`}>
                        {overdue ? 'Gecikmiş: ' : 'Sonraki: '}{formatDateLong(nextDue)}
                      </div>
                    )}
                    {done && (
                      <div className="text-xs text-emerald-700 mt-0.5 flex items-center gap-1">
                        <Check className="w-3 h-3" /> Tamamlandı
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-0.5 -mr-2">
                    <IconButton onClick={() => onEdit(loan)} title="Düzenle">
                      <Pencil className="w-5 h-5" />
                    </IconButton>
                    <IconButton onClick={() => onDelete(loan.id)} title="Sil" tone="danger">
                      <Trash2 className="w-5 h-5" />
                    </IconButton>
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between text-xs text-stone-600">
                  <span>{loan.installmentsPaid}/{loan.installmentCount} taksit · {formatMoney(totalPaid, loan.currency)} ödendi</span>
                  <span className="font-medium">{formatMoney(remainingAmount, loan.currency)} kaldı</span>
                </div>
                <div className="mt-1.5 h-2 bg-stone-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${done ? 'bg-emerald-500' : pct > 75 ? 'bg-emerald-400' : pct > 30 ? 'bg-violet-500' : 'bg-violet-400'}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>

                {!done && (
                  <button
                    onClick={() => onPay(loan)}
                    className={`mt-3 w-full py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2 ${overdue ? 'bg-rose-600 hover:bg-rose-700 text-white' : 'bg-violet-600 hover:bg-violet-700 text-white'}`}
                  >
                    <Check className="w-4 h-4" />
                    {loan.installmentsPaid + 1}. taksiti öde ({formatMoney(loan.monthlyPayment, loan.currency)})
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
