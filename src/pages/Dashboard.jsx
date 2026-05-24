import { useMemo, useState } from 'react';
import {
  PieChart, Pie, Cell, ResponsiveContainer, ComposedChart, Line, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine,
} from 'recharts';
import {
  Plus, ArrowLeftRight, AlertTriangle, Repeat, ArrowDownRight, ArrowUpRight,
  TrendingUp, Clock, ChevronRight,
} from 'lucide-react';
import { PIE_COLORS, getCat } from '../constants.js';
import { todayStr, toDateStr, addDays, cmpDate } from '../lib/date.js';
import { formatMoney, formatNum, convertToTRY } from '../lib/format.js';
import { getAccountBalanceTRY, getSettledBalanceTRY } from '../lib/balance.js';
import { projectMonthlyFlows, forecastBalanceTRY, forecastRecurringInRange } from '../lib/flows.js';
import { isSettled, inDateRange } from '../lib/predicates.js';
import StatCard from '../components/StatCard.jsx';
import TxRow from '../components/TxRow.jsx';

export default function Dashboard({ accounts, txs, recurring, fx, setView, onAdd, onTransfer }) {
  const today = todayStr();
  const totalTRY = useMemo(
    () => accounts.reduce((s, a) => s + getAccountBalanceTRY(a, txs, fx.rates), 0),
    [accounts, txs, fx],
  );

  const [chartView, setChartView] = useState('all'); // 'past' | 'all' | 'future'
  const chartRange = chartView === 'past' ? { from: -5, to: 0 }
                  : chartView === 'future' ? { from: 1, to: 6 }
                  :                          { from: -5, to: 6 };

  const now = useMemo(() => new Date(), []);
  const allMonths = useMemo(() => {
    const arr = [];
    for (let i = chartRange.from; i <= chartRange.to; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
      arr.push({ y: d.getFullYear(), m: d.getMonth(), isForecast: i > 0 });
    }
    return arr;
  }, [now, chartRange.from, chartRange.to]);

  const flows = useMemo(() => {
    const raw = projectMonthlyFlows(allMonths, accounts, txs, recurring, fx.rates);
    const first = allMonths[0];
    const prevMonthEnd = toDateStr(new Date(first.y, first.m, 0));
    let startBalance;
    if (cmpDate(prevMonthEnd, today) <= 0) {
      startBalance = getSettledBalanceTRY(accounts, txs, fx.rates, prevMonthEnd);
    } else {
      const settled = getSettledBalanceTRY(accounts, txs, fx.rates, today);
      let delta = 0;
      for (const acc of accounts) {
        const items = forecastRecurringInRange(recurring, acc.id, addDays(today, 1), prevMonthEnd, fx.rates);
        for (const it of items) {
          delta += it.type === 'gelir' ? it.amountTRY : -it.amountTRY;
        }
      }
      startBalance = settled + delta;
    }
    let running = startBalance;
    return raw.map((f, i) => {
      running += f.income - f.expense;
      return { ...f, isForecast: allMonths[i].isForecast, closingBalance: running };
    });
  }, [allMonths, accounts, txs, recurring, fx, today]);

  const thisMonthFlow = useMemo(() => {
    const cm = [{ y: now.getFullYear(), m: now.getMonth() }];
    const [r] = projectMonthlyFlows(cm, accounts, txs, recurring, fx.rates);
    return r || { income: 0, expense: 0, net: 0 };
  }, [now, accounts, txs, recurring, fx]);

  const carryoverBalance = useMemo(() => {
    const prevMonthEnd = toDateStr(new Date(now.getFullYear(), now.getMonth(), 0));
    return getSettledBalanceTRY(accounts, txs, fx.rates, prevMonthEnd);
  }, [now, accounts, txs, fx]);

  const forecastBoundary = chartView === 'all' ? flows.find(f => f.isForecast)?.fullLabel : null;

  const monthStart = toDateStr(new Date(now.getFullYear(), now.getMonth(), 1));
  const monthEnd = toDateStr(new Date(now.getFullYear(), now.getMonth() + 1, 0));
  const catBreakdown = useMemo(() => {
    const m = new Map();
    for (const t of txs) {
      if (t.type !== 'gider') continue;
      if (!isSettled(t)) continue;
      if (!inDateRange(t, monthStart, monthEnd)) continue;
      const trySum = t.amountTRY != null ? t.amountTRY : convertToTRY(t.amount, t.currency, fx.rates);
      m.set(t.category, (m.get(t.category) || 0) + trySum);
    }
    return [...m.entries()]
      .map(([id, value]) => ({ id, label: getCat('gider', id).label, value }))
      .sort((a, b) => b.value - a.value);
  }, [txs, monthStart, monthEnd, fx]);

  const pendingTotal = useMemo(() => {
    let sum = 0;
    for (const t of txs) {
      if (t.status !== 'pending' || t.type !== 'gider') continue;
      sum += t.amountTRY != null ? t.amountTRY : convertToTRY(t.amount, t.currency, fx.rates);
    }
    return sum;
  }, [txs, fx]);

  const recent = useMemo(
    () => [...txs].sort((a, b) => cmpDate(b.date, a.date) || b.createdAt - a.createdAt).slice(0, 6),
    [txs],
  );

  const horizon = addDays(today, 30);
  const forecast30 = useMemo(
    () => forecastBalanceTRY(accounts, txs, recurring, fx.rates, horizon),
    [accounts, txs, recurring, fx, horizon],
  );

  return (
    <div className="space-y-6">
      <section className="rounded-2xl bg-gradient-to-br from-amber-700 to-amber-600 text-white p-5 shadow">
        <div className="text-xs uppercase tracking-wide text-amber-100/80">Toplam Bakiye</div>
        <div className="text-3xl font-semibold mt-1">{formatMoney(totalTRY, 'TRY')}</div>
        <div className="mt-1 text-xs text-amber-100/80">
          30 gün sonra tahmin: {formatMoney(forecast30, 'TRY')}
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <button onClick={onAdd} className="rounded-xl bg-white/15 hover:bg-white/25 backdrop-blur px-3 py-2 text-sm flex items-center justify-center gap-1.5">
            <Plus className="w-4 h-4" /> İşlem ekle
          </button>
          <button onClick={onTransfer} className="rounded-xl bg-white/15 hover:bg-white/25 backdrop-blur px-3 py-2 text-sm flex items-center justify-center gap-1.5">
            <ArrowLeftRight className="w-4 h-4" /> Transfer
          </button>
        </div>
      </section>

      <section className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard
          label={carryoverBalance < 0 ? 'Devren borç' : 'Devren bakiye'}
          value={formatMoney(carryoverBalance, 'TRY', true)}
          Icon={carryoverBalance < 0 ? AlertTriangle : Repeat}
          tone={carryoverBalance < 0 ? 'rose' : carryoverBalance > 0 ? 'emerald' : 'amber'}
        />
        <StatCard label="Bu ay gelir" value={formatMoney(thisMonthFlow.income, 'TRY')} Icon={ArrowDownRight} tone="emerald" />
        <StatCard label="Bu ay gider" value={formatMoney(thisMonthFlow.expense, 'TRY')} Icon={ArrowUpRight} tone="rose" />
        <StatCard label="Bu ay net" value={formatMoney(thisMonthFlow.net, 'TRY', true)} Icon={TrendingUp} tone={thisMonthFlow.net >= 0 ? 'emerald' : 'rose'} />
      </section>

      {pendingTotal > 0 && (
        <button
          onClick={() => setView({ name: 'transactions', filter: 'pending' })}
          className="w-full bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 flex items-center gap-3 text-left hover:bg-amber-100 transition"
        >
          <Clock className="w-5 h-5 text-amber-700 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-amber-900">Bekleyen ödemeler</div>
            <div className="text-xs text-amber-700">Bakiyeyi etkilemeyen, henüz ödenmemiş giderler</div>
          </div>
          <div className="font-semibold text-amber-900">{formatMoney(pendingTotal, 'TRY')}</div>
          <ChevronRight className="w-4 h-4 text-amber-700" />
        </button>
      )}

      <section className="bg-white rounded-2xl border border-stone-200 p-4">
        <div className="flex items-center justify-between mb-2 gap-2 flex-wrap">
          <div className="font-semibold text-stone-800">
            {chartView === 'past' ? 'Son 6 ay' : chartView === 'future' ? 'Gelecek 6 ay' : 'Son 6 ay · Tahmin 6 ay'}
          </div>
          <div className="flex bg-stone-100 rounded-full p-0.5 text-xs">
            {[
              { id: 'past', label: 'Geçmiş 6' },
              { id: 'all', label: '12 ay' },
              { id: 'future', label: 'Gelecek 6' },
            ].map(v => (
              <button
                key={v.id}
                onClick={() => setChartView(v.id)}
                className={`px-2.5 py-1 rounded-full transition ${chartView === v.id ? 'bg-white text-stone-800 shadow-sm font-medium' : 'text-stone-500'}`}
              >
                {v.label}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-3 text-[11px] text-stone-500 mb-1">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-emerald-400" />Gelir</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-rose-400" />Gider</span>
          <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-violet-600" />Bakiye</span>
        </div>
        <div className="h-64">
          <ResponsiveContainer>
            <ComposedChart data={flows} margin={{ top: 12, right: 4, left: 0, bottom: 8 }}>
              <CartesianGrid stroke="#f1ede6" vertical={false} />
              <XAxis
                dataKey="fullLabel"
                tick={{ angle: -35, textAnchor: 'end', fontSize: 10, fill: '#78716c' }}
                axisLine={false}
                tickLine={false}
                interval={0}
                height={42}
              />
              <YAxis
                yAxisId="left"
                tick={{ fontSize: 10, fill: '#78716c' }}
                axisLine={false}
                tickLine={false}
                width={38}
                tickFormatter={(v) => Math.round(v / 1000) + 'k'}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                tick={{ fontSize: 10, fill: '#7C3AED' }}
                axisLine={false}
                tickLine={false}
                width={40}
                tickFormatter={(v) => Math.round(v / 1000) + 'k'}
              />
              <Tooltip
                formatter={(v, n) => {
                  const label = n === 'income' ? 'Gelir' : n === 'expense' ? 'Gider' : 'Bakiye';
                  return [formatMoney(v, 'TRY'), label];
                }}
                labelFormatter={(label, payload) => {
                  const f = payload?.[0]?.payload;
                  return f?.isForecast ? `${label} · tahmin` : label;
                }}
                contentStyle={{ borderRadius: 10, border: '1px solid #e7e5e4', fontSize: 12 }}
              />
              <ReferenceLine yAxisId="right" y={0} stroke="#dc2626" strokeDasharray="2 4" />
              {forecastBoundary && (
                <ReferenceLine
                  yAxisId="left"
                  x={forecastBoundary}
                  stroke="#a8a29e"
                  strokeDasharray="3 3"
                  label={{ value: 'Tahmin', position: 'top', fontSize: 10, fill: '#78716c' }}
                />
              )}
              <Bar yAxisId="left" dataKey="income" radius={[4, 4, 0, 0]}>
                {flows.map((f, i) => (
                  <Cell key={`in-${i}`} fill={f.isForecast ? '#A8C88660' : '#A8C886'} />
                ))}
              </Bar>
              <Bar yAxisId="left" dataKey="expense" radius={[4, 4, 0, 0]}>
                {flows.map((f, i) => (
                  <Cell key={`ex-${i}`} fill={f.isForecast ? '#DC8A6E60' : '#DC8A6E'} />
                ))}
              </Bar>
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="closingBalance"
                stroke="#7C3AED"
                strokeWidth={2}
                dot={{ r: 3, fill: '#7C3AED', strokeWidth: 0 }}
                activeDot={{ r: 5 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="grid md:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-stone-200 p-4">
          <div className="font-semibold mb-2 text-stone-800">Kategori dağılımı (bu ay)</div>
          {catBreakdown.length === 0 ? (
            <div className="text-sm text-stone-500 py-8 text-center">Bu ay henüz gider yok.</div>
          ) : (
            <div className="h-48 flex items-center">
              <div className="flex-1 h-full">
                <ResponsiveContainer>
                  <PieChart>
                    <Pie data={catBreakdown} dataKey="value" nameKey="label" innerRadius={32} outerRadius={68} paddingAngle={2}>
                      {catBreakdown.map((c, i) => <Cell key={c.id} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                    </Pie>
                    <Tooltip formatter={(v) => formatMoney(v, 'TRY')} contentStyle={{ borderRadius: 10, border: '1px solid #e7e5e4', fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <ul className="flex-1 text-xs space-y-1 pr-2">
                {catBreakdown.slice(0, 6).map((c, i) => (
                  <li key={c.id} className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-sm" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                    <span className="flex-1 text-stone-700 truncate">{c.label}</span>
                    <span className="text-stone-500">{formatNum(c.value, 0)} ₺</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-stone-200 p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="font-semibold text-stone-800">Son işlemler</div>
            <button onClick={() => setView({ name: 'transactions' })} className="text-xs text-amber-700 hover:underline">Tümü</button>
          </div>
          {recent.length === 0 ? (
            <div className="text-sm text-stone-500 py-6 text-center">Henüz işlem yok.</div>
          ) : (
            <ul className="space-y-1.5">
              {recent.map(t => (
                <li key={t.id} className="flex items-center gap-3">
                  <TxRow tx={t} accounts={accounts} compact />
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}
