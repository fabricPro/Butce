import { Plus, Repeat, PauseCircle, PlayCircle, Pencil, Trash2 } from 'lucide-react';
import { getAccount } from '../constants.js';
import { addDays, formatDateLong, todayStr } from '../lib/date.js';
import { nextOccurrence, describeFrequency } from '../lib/recurring.js';
import EmptyState from '../components/EmptyState.jsx';
import IconButton from '../components/IconButton.jsx';
import Amount from '../components/Amount.jsx';

export default function RecurringPage({ rules, accounts, onAdd, onEdit, onDelete, onToggle }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-stone-900">Tekrarlar</h2>
        <button onClick={onAdd} className="min-h-[40px] px-3.5 rounded-full bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white text-sm flex items-center gap-1.5 transition-colors">
          <Plus className="w-4 h-4" /> Tekrar
        </button>
      </div>

      {rules.length === 0 ? (
        <EmptyState
          Icon={Repeat}
          text="Kira, maaş, fatura gibi düzenli işlemler için tekrar ekle — uygulama her ayını otomatik doldurur."
          actionLabel="+ Tekrar Ekle"
          onAction={onAdd}
        />
      ) : (
        <ul className="space-y-2">
          {rules.map(r => {
            const acc = getAccount(accounts, r.accountId);
            const isIncome = r.type === 'gelir';
            const upcoming = r.active
              ? nextOccurrence(r, addDays(r.lastGeneratedDate || addDays(todayStr(), -1), 1))
              : null;
            return (
              <li key={r.id} className={`bg-white rounded-2xl shadow-card border border-stone-100 p-4 flex items-center gap-3 ${r.active ? '' : 'opacity-60'}`}>
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
                <Amount value={r.amount} currency={r.currency} type={r.type} />
                <div className="flex items-center gap-0.5 ml-1 -mr-2">
                  <IconButton onClick={() => onToggle(r.id)} title={r.active ? 'Duraklat' : 'Aktifleştir'}>
                    {r.active ? <PauseCircle className="w-5 h-5" /> : <PlayCircle className="w-5 h-5" />}
                  </IconButton>
                  <IconButton onClick={() => onEdit(r)} title="Düzenle">
                    <Pencil className="w-5 h-5" />
                  </IconButton>
                  <IconButton onClick={() => onDelete(r.id)} title="Sil" tone="danger">
                    <Trash2 className="w-5 h-5" />
                  </IconButton>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
