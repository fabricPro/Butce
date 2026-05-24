import { ArrowDownLeft, ArrowUpRight } from 'lucide-react';
import { CURRENCIES } from '../constants.js';
import { formatNum } from '../lib/format.js';

/**
 * Renders a money value with:
 * - Tabular numerals so columns of amounts line up across rows.
 * - An icon paired with the sign color so the income/expense
 *   distinction is conveyed without relying on color alone (a11y).
 * - Optional pending strikethrough.
 *
 * Props:
 *   value         number   absolute amount (sign comes from `type`)
 *   currency      'TRY' | 'USD' | 'EUR'
 *   type          'gelir' | 'gider' | null     null = neutral (no sign/icon)
 *   pending       bool                          dim + strikethrough
 *   amountTRY     number                        when currency !== TRY, shown small below
 *   hideIcon      bool                          omit the arrow (cards already use type elsewhere)
 *   size          'sm' | 'md' | 'lg'            text size
 */
export default function Amount({
  value, currency = 'TRY', type, pending, amountTRY, hideIcon, size = 'md',
}) {
  const isIncome = type === 'gelir';
  const isExpense = type === 'gider';
  const sign = isIncome ? '+' : isExpense ? '−' : '';
  const symbol = CURRENCIES[currency]?.symbol || '';

  const sizeClass =
    size === 'sm' ? 'text-sm' :
    size === 'lg' ? 'text-lg' :
                    'text-sm';

  const colorClass = pending
    ? 'text-stone-500 line-through'
    : isIncome  ? 'text-emerald-700'
    : isExpense ? 'text-rose-700'
    :             'text-stone-800';

  const Icon = isIncome ? ArrowDownLeft : isExpense ? ArrowUpRight : null;

  return (
    <div className="text-right">
      <div className={`font-semibold tabular-nums inline-flex items-center gap-1 ${sizeClass} ${colorClass}`}>
        {Icon && !hideIcon && <Icon className="w-3.5 h-3.5 opacity-70" aria-hidden />}
        <span>{sign}{formatNum(value)} {symbol}</span>
      </div>
      {currency !== 'TRY' && amountTRY != null && (
        <div className="text-xs text-stone-500 tabular-nums">≈ {formatNum(amountTRY, 0)} ₺</div>
      )}
    </div>
  );
}
