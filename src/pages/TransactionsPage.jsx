import { useMemo, useState } from 'react';
import { Plus, Trash2, Clock, CheckCircle2 } from 'lucide-react';
import { CATS } from '../constants.js';
import { cmpDate, formatDateLong } from '../lib/date.js';
import EmptyState from '../components/EmptyState.jsx';
import Pill from '../components/Pill.jsx';
import TxRow from '../components/TxRow.jsx';
import IconButton from '../components/IconButton.jsx';

export default function TransactionsPage({
  accounts, txs, onAdd, onEdit, onDelete, onMarkPaid, initialStatus,
}) {
  const [filterType, setFilterType] = useState('all');
  const [filterAccount, setFilterAccount] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStatus, setFilterStatus] = useState(initialStatus || 'all');

  const filtered = useMemo(() => txs
    .filter(t => filterType === 'all' || t.type === filterType)
    .filter(t => filterAccount === 'all' || t.accountId === filterAccount)
    .filter(t => filterCategory === 'all' || t.category === filterCategory)
    .filter(t => filterStatus === 'all' || (t.status || 'paid') === filterStatus)
    .sort((a, b) => cmpDate(b.date, a.date) || b.createdAt - a.createdAt),
  [txs, filterType, filterAccount, filterCategory, filterStatus]);

  const groups = useMemo(() => {
    const m = new Map();
    for (const t of filtered) {
      if (!m.has(t.date)) m.set(t.date, []);
      m.get(t.date).push(t);
    }
    return [...m.entries()];
  }, [filtered]);

  const pendingCount = useMemo(() => txs.filter(t => t.status === 'pending').length, [txs]);

  const categoryOptions = filterType === 'gelir' ? CATS.gelir : filterType === 'gider' ? CATS.gider : [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-stone-800">İşlemler</h2>
        <button onClick={onAdd} className="min-h-[40px] px-3.5 rounded-full bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white text-sm flex items-center gap-1.5 transition-colors">
          <Plus className="w-4 h-4" /> İşlem
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-stone-200 p-3 flex flex-wrap gap-2 items-center text-sm">
        <Pill active={filterType === 'all'} onClick={() => { setFilterType('all'); setFilterCategory('all'); }}>Tümü</Pill>
        <Pill active={filterType === 'gelir'} onClick={() => { setFilterType('gelir'); setFilterCategory('all'); }} tone="emerald">Gelir</Pill>
        <Pill active={filterType === 'gider'} onClick={() => { setFilterType('gider'); setFilterCategory('all'); }} tone="rose">Gider</Pill>
        {pendingCount > 0 && (
          <Pill active={filterStatus === 'pending'} onClick={() => setFilterStatus(filterStatus === 'pending' ? 'all' : 'pending')} tone="amber">
            <Clock className="w-3 h-3 inline -mt-0.5 mr-0.5" />Bekleyen ({pendingCount})
          </Pill>
        )}
        <select
          value={filterAccount}
          onChange={(e) => setFilterAccount(e.target.value)}
          className="ml-auto bg-stone-100 rounded-full px-3 py-1 text-xs"
        >
          <option value="all">Tüm hesaplar</option>
          {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
        </select>
        {categoryOptions.length > 0 && (
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="bg-stone-100 rounded-full px-3 py-1 text-xs"
          >
            <option value="all">Tüm kategoriler</option>
            {categoryOptions.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
          </select>
        )}
      </div>

      {groups.length === 0 ? (
        <EmptyState text="İşlem yok." />
      ) : (
        <div className="space-y-4">
          {groups.map(([date, items]) => (
            <div key={date} className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
              <div className="px-4 py-2 text-xs uppercase tracking-wide text-stone-500 bg-stone-50 border-b border-stone-100">
                {formatDateLong(date)}
              </div>
              <ul className="divide-y divide-stone-100">
                {items.map(t => (
                  <li
                    key={t.id}
                    className="px-3 py-2 hover:bg-stone-50 active:bg-stone-100 flex items-center gap-2 cursor-pointer transition-colors"
                    onClick={() => onEdit(t)}
                  >
                    <TxRow tx={t} accounts={accounts} expanded />
                    {t.status === 'pending' && onMarkPaid && (
                      <IconButton
                        onClick={(e) => { e.stopPropagation(); onMarkPaid(t); }}
                        title="Ödendi olarak işaretle"
                        tone="success"
                      >
                        <CheckCircle2 className="w-5 h-5" />
                      </IconButton>
                    )}
                    <IconButton
                      onClick={(e) => { e.stopPropagation(); onDelete(t.id); }}
                      title="Sil"
                      tone="danger"
                    >
                      <Trash2 className="w-5 h-5" />
                    </IconButton>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
