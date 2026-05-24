import { Plus, Repeat, PauseCircle, PlayCircle, Pencil, Trash2 } from 'lucide-react';
import { CURRENCIES, getAccount } from '../constants.js';
import { formatNum } from '../lib/format.js';
import { addDays, formatDateLong, todayStr } from '../lib/date.js';
import { nextOccurrence, describeFrequency } from '../lib/recurring.js';
import EmptyState from '../components/EmptyState.jsx';

export default function RecurringPage({ rules, accounts, onAdd, onEdit, onDelete, onToggle }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-stone-800">Tekrarlar</h2>
        <button onClick={onAdd} className="px-3 py-1.5 rounded-full bg-amber-600 text-white text-sm flex items-center gap-1.5">
          <Plus className="w-4 h-4" /> Tekrar
        </button>
      </div>

      {rules.length === 0 ? (
        <EmptyState text="Düzenli ödeme veya gelir varsa tekrar olarak ekle." />
      ) : (
        <ul className="space-y-2">
          {rules.map(r => {
            const acc = getAccount(accounts, r.accountId);
            const isIncome = r.type === 'gelir';
            const upcoming = r.active
              ? nextOccurrence(r, addDays(r.lastGeneratedDate || addDays(todayStr(), -1), 1))
              : null;
            return (
              <li key={r.id} className={`bg-white rounded-2xl border border-stone-200 p-4 flex items-center gap-3 ${r.active ? '' : 'opacity-60'}`}>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isIncome ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                  <Repeat className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-stone-800 truncate">{r.name}</div>
                  <div className="text-xs text-stone-500">
                    {describeFrequency(r)} · {acc?.name || 'Hesap silinmiş'}
                  </div>
                  {upcoming && (
                    <div className="text-xs text-amber-700 mt-0.5">Sonraki: {formatDateLong(upcoming)}</div>
                  )}
                </div>
                <div className="text-right">
                  <div className={`font-semibold ${isIncome ? 'text-emerald-700' : 'text-rose-700'}`}>
                    {isIncome ? '+' : '−'}{formatNum(r.amount)} {CURRENCIES[r.currency]?.symbol || ''}
                  </div>
                </div>
                <div className="flex items-center gap-1 ml-2">
                  <button onClick={() => onToggle(r.id)} className="p-2 rounded-lg hover:bg-stone-100 text-stone-600" title={r.active ? 'Duraklat' : 'Aktifleştir'}>
                    {r.active ? <PauseCircle className="w-4 h-4" /> : <PlayCircle className="w-4 h-4" />}
                  </button>
                  <button onClick={() => onEdit(r)} className="p-2 rounded-lg hover:bg-stone-100 text-stone-600" title="Düzenle">
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button onClick={() => onDelete(r.id)} className="p-2 rounded-lg hover:bg-rose-50 text-rose-600" title="Sil">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
