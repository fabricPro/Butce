import { Clock } from 'lucide-react';
import { CURRENCIES, getCat, getAccount } from '../constants.js';
import { formatNum } from '../lib/format.js';
import { formatDateShort } from '../lib/date.js';

export default function TxRow({ tx, accounts, compact, expanded }) {
  const cat = getCat(tx.type, tx.category);
  const Icon = cat.Icon;
  const isIncome = tx.type === 'gelir';
  const isPending = tx.status === 'pending';
  const acc = getAccount(accounts, tx.accountId);
  const accColor = acc?.color || '#999';
  return (
    <>
      <div
        className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 relative ${isPending ? 'opacity-70' : ''}`}
        style={{ background: accColor + '20', color: accColor }}
      >
        <Icon className="w-4 h-4" />
        {isPending && (
          <span
            className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-amber-500 text-white flex items-center justify-center"
            title="Bekleyen ödeme"
          >
            <Clock className="w-2.5 h-2.5" />
          </span>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className={`text-sm font-medium truncate ${isPending ? 'text-stone-500' : 'text-stone-800'}`}>
          {tx.note || cat.label}
        </div>
        <div className="text-xs text-stone-500 flex items-center gap-1 truncate">
          <span>{cat.label}</span>
          {acc && <span>· {acc.name}</span>}
          {tx.source === 'recurring' && <span className="text-amber-700">· tekrar</span>}
          {tx.source === 'transfer' && <span className="text-sky-700">· transfer</span>}
          {tx.source === 'loan' && <span className="text-violet-700">· kredi</span>}
          {isPending && <span className="text-amber-700 font-medium">· bekliyor</span>}
          {!compact && expanded && <span className="text-stone-400">· {formatDateShort(tx.date)}</span>}
        </div>
      </div>
      <div className="text-right">
        <div className={`font-semibold ${isPending ? 'text-stone-400 line-through' : isIncome ? 'text-emerald-700' : 'text-rose-700'}`}>
          {isIncome ? '+' : '−'}{formatNum(tx.amount)} {CURRENCIES[tx.currency]?.symbol || ''}
        </div>
        {tx.currency !== 'TRY' && (
          <div className="text-xs text-stone-500">≈ {formatNum(tx.amountTRY ?? 0, 0)} ₺</div>
        )}
      </div>
    </>
  );
}
