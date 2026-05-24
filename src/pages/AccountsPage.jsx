import { Plus, Wallet, Calendar, Pencil, Trash2 } from 'lucide-react';
import { ACCOUNT_TYPES } from '../constants.js';
import { formatMoney } from '../lib/format.js';
import { getAccountNativeBalance, getAccountBalanceTRY } from '../lib/balance.js';
import EmptyState from '../components/EmptyState.jsx';
import IconButton from '../components/IconButton.jsx';

export default function AccountsPage({ accounts, txs, fx, onAdd, onEdit, onDelete, onOpen }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-stone-900">Hesaplar</h2>
        <button onClick={onAdd} className="min-h-[40px] px-3.5 rounded-full bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white text-sm flex items-center gap-1.5 transition-colors">
          <Plus className="w-4 h-4" /> Hesap
        </button>
      </div>

      {accounts.length === 0 ? (
        <EmptyState text="Henüz hesap yok. İlk hesabını oluştur." />
      ) : (
        <ul className="space-y-2">
          {accounts.map(a => {
            const Icon = ACCOUNT_TYPES[a.type]?.Icon || Wallet;
            const native = getAccountNativeBalance(a, txs);
            const tryEq = getAccountBalanceTRY(a, txs, fx.rates);
            const isCard = a.type === 'kredi_karti';
            return (
              <li key={a.id} className="bg-white rounded-2xl shadow-card border border-stone-100 p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: a.color + '20', color: a.color }}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-stone-800 truncate">{a.name}</div>
                  <div className="text-xs text-stone-500">
                    {ACCOUNT_TYPES[a.type]?.label} · {a.currency}
                    {isCard && a.cutoffDay ? ` · Kesim ${a.cutoffDay}. gün` : ''}
                  </div>
                </div>
                <div className="text-right">
                  <div className={`font-semibold ${native < 0 ? 'text-rose-700' : 'text-stone-800'}`}>
                    {formatMoney(native, a.currency)}
                  </div>
                  {a.currency !== 'TRY' && (
                    <div className="text-xs text-stone-500">≈ {formatMoney(tryEq, 'TRY')}</div>
                  )}
                </div>
                <div className="flex items-center gap-0.5 ml-1 -mr-2">
                  {isCard && (
                    <IconButton onClick={() => onOpen(a)} title="Ekstre">
                      <Calendar className="w-5 h-5" />
                    </IconButton>
                  )}
                  <IconButton onClick={() => onEdit(a)} title="Düzenle">
                    <Pencil className="w-5 h-5" />
                  </IconButton>
                  <IconButton onClick={() => onDelete(a.id)} title="Sil" tone="danger">
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
