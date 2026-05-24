import { useMemo } from 'react';
import { Plus, Pencil, Trash2, AlertTriangle } from 'lucide-react';
import { getCat } from '../constants.js';
import { toDateStr } from '../lib/date.js';
import { formatMoney, convertToTRY } from '../lib/format.js';
import { isSettled, inDateRange } from '../lib/predicates.js';
import EmptyState from '../components/EmptyState.jsx';
import IconButton from '../components/IconButton.jsx';

export default function BudgetsPage({ budgets, txs, fx, onAdd, onEdit, onDelete }) {
  const now = new Date();
  const monthStart = toDateStr(new Date(now.getFullYear(), now.getMonth(), 1));
  const monthEnd = toDateStr(new Date(now.getFullYear(), now.getMonth() + 1, 0));

  const spendByCat = useMemo(() => {
    const m = new Map();
    for (const t of txs) {
      if (t.type !== 'gider') continue;
      if (!isSettled(t)) continue;
      if (!inDateRange(t, monthStart, monthEnd)) continue;
      const trySum = t.amountTRY != null ? t.amountTRY : convertToTRY(t.amount, t.currency, fx.rates);
      m.set(t.category, (m.get(t.category) || 0) + trySum);
    }
    return m;
  }, [txs, monthStart, monthEnd, fx]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-stone-800">Aylık Bütçe Hedefleri</h2>
        <button onClick={onAdd} className="min-h-[40px] px-3.5 rounded-full bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white text-sm flex items-center gap-1.5 transition-colors">
          <Plus className="w-4 h-4" /> Hedef
        </button>
      </div>

      {budgets.length === 0 ? (
        <EmptyState text="Kategoriler için aylık harcama hedefi belirle." />
      ) : (
        <ul className="space-y-2">
          {budgets.map(g => {
            const cat = getCat('gider', g.category);
            const spent = spendByCat.get(g.category) || 0;
            const pct = g.limit > 0 ? Math.min(100, (spent / g.limit) * 100) : 0;
            const over = spent > g.limit;
            return (
              <li key={g.id} className="bg-white rounded-2xl border border-stone-200 p-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-stone-100 text-stone-700 flex items-center justify-center">
                    <cat.Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-stone-800">{cat.label}</div>
                    <div className="text-xs text-stone-500">
                      {formatMoney(spent, 'TRY')} / {formatMoney(g.limit, 'TRY')}
                    </div>
                  </div>
                  <div className="flex items-center gap-0.5 -mr-2">
                    <IconButton onClick={() => onEdit(g)} title="Düzenle">
                      <Pencil className="w-5 h-5" />
                    </IconButton>
                    <IconButton onClick={() => onDelete(g.id)} title="Sil" tone="danger">
                      <Trash2 className="w-5 h-5" />
                    </IconButton>
                  </div>
                </div>
                <div className="mt-3 h-2 bg-stone-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${over ? 'bg-rose-500' : pct > 80 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                {over && (
                  <div className="mt-2 text-xs text-rose-700 flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" /> Hedef aşıldı
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
