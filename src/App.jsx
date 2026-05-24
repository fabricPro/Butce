import { useCallback, useEffect, useState } from 'react';
import { AlertTriangle } from 'lucide-react';

import { supabase, supabaseConfigured } from './supabase.js';
import { api } from './api.js';

import { uid, getAccount } from './constants.js';
import { todayStr } from './lib/date.js';
import { ensureFxRates, saveManualRates, INITIAL_FX } from './lib/fx.js';
import { materializeRules } from './lib/recurring.js';

import LoadingScreen from './auth/LoadingScreen.jsx';
import ConfigErrorScreen from './auth/ConfigErrorScreen.jsx';
import LoginScreen from './auth/LoginScreen.jsx';

import Header from './components/nav/Header.jsx';
import BottomNav from './components/nav/BottomNav.jsx';
import DashboardSkeleton from './components/skeletons/DashboardSkeleton.jsx';

import { RefreshCw } from 'lucide-react';
import usePullToRefresh from './hooks/usePullToRefresh.js';

import Dashboard from './pages/Dashboard.jsx';
import AccountsPage from './pages/AccountsPage.jsx';
import TransactionsPage from './pages/TransactionsPage.jsx';
import RecurringPage from './pages/RecurringPage.jsx';
import BudgetsPage from './pages/BudgetsPage.jsx';
import LoansPage from './pages/LoansPage.jsx';
import CardCyclePage from './pages/CardCyclePage.jsx';
import SettingsPage from './pages/SettingsPage.jsx';

import TxModal from './modals/TxModal.jsx';
import AccountModal from './modals/AccountModal.jsx';
import TransferModal from './modals/TransferModal.jsx';
import RecurringModal from './modals/RecurringModal.jsx';
import BudgetModal from './modals/BudgetModal.jsx';
import LoanModal from './modals/LoanModal.jsx';

/* ============================================================
   ROOT
   ============================================================ */

export default function App() {
  const [authReady, setAuthReady] = useState(false);
  const [session, setSession] = useState(null);

  useEffect(() => {
    if (!supabaseConfigured) { setAuthReady(true); return; }
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session || null);
      setAuthReady(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_evt, sess) => setSession(sess || null));
    return () => sub.subscription.unsubscribe();
  }, []);

  if (!authReady) return <LoadingScreen />;
  if (!supabaseConfigured) return <ConfigErrorScreen />;
  if (!session) return <LoginScreen />;
  return <AppCore session={session} />;
}

/* ============================================================
   APP CORE
   ============================================================ */

function AppCore({ session }) {
  const [booted, setBooted] = useState(false);
  const [bootError, setBootError] = useState(null);
  const [view, setView] = useState({ name: 'dashboard' });
  const [accounts, setAccounts] = useState([]);
  const [txs, setTxs] = useState([]);
  const [recurring, setRecurring] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [loans, setLoans] = useState([]);
  const [fx, setFx] = useState(INITIAL_FX);
  const [modal, setModal] = useState(null);
  const [toasts, setToasts] = useState([]);

  // Bootstrap
  useEffect(() => {
    (async () => {
      try {
        const [accs, t, r, b, ln, fxData] = await Promise.all([
          api.listAccounts(),
          api.listTransactions(),
          api.listRules(),
          api.listGoals(),
          api.listLoans(),
          ensureFxRates(false),
        ]);

        const { newTxs, updatedRules } = materializeRules(r, accs, fxData.rates);
        let txsAfter = t;
        if (newTxs.length > 0) {
          await api.bulkInsertTransactions(newTxs);
          txsAfter = [...newTxs, ...t];
        }
        const changedRules = updatedRules.filter((nr, i) => JSON.stringify(nr) !== JSON.stringify(r[i]));
        await Promise.all(changedRules.map(cr => api.upsertRule(cr)));

        setAccounts(accs);
        setTxs(txsAfter);
        setRecurring(updatedRules);
        setBudgets(b);
        setLoans(ln);
        setFx(fxData);
        setBooted(true);
      } catch (e) {
        console.error('bootstrap', e);
        setBootError(e?.message || String(e));
      }
    })();
  }, [session.user.id]);

  // Queue-based toast: multiple toasts stack and auto-dismiss independently.
  // `opts.actionLabel + opts.onAction` lets a toast offer an undo action
  // (e.g. "Geri al" on delete).
  const flashToast = useCallback((message, kind = 'info', opts) => {
    const id = uid('toast');
    const duration = opts?.actionLabel ? 6000 : 2800;
    setToasts(t => [...t, { id, message, kind, actionLabel: opts?.actionLabel, onAction: opts?.onAction }]);
    setTimeout(() => {
      setToasts(t => t.filter(x => x.id !== id));
    }, duration);
  }, []);

  const dismissToast = useCallback((id) => {
    setToasts(t => t.filter(x => x.id !== id));
  }, []);

  // Error-aware wrapper: call fn; on failure, flash toast (caller handles state).
  const runApi = useCallback(async (fn) => {
    try {
      await fn();
      return true;
    } catch (e) {
      console.error(e);
      flashToast('Kaydedilemedi: ' + (e.message || e), 'warn');
      return false;
    }
  }, [flashToast]);

  /* ---- Full reload (pull-to-refresh) ---- */
  const reloadAll = useCallback(async () => {
    try {
      const [accs, t, r, b, ln, fxData] = await Promise.all([
        api.listAccounts(),
        api.listTransactions(),
        api.listRules(),
        api.listGoals(),
        api.listLoans(),
        ensureFxRates(true),
      ]);
      setAccounts(accs);
      setTxs(t);
      setRecurring(r);
      setBudgets(b);
      setLoans(ln);
      setFx(fxData);
      flashToast('Yenilendi', 'success');
    } catch (e) {
      flashToast('Yenilenemedi: ' + (e.message || e), 'warn');
    }
  }, [flashToast]);

  const { pull, refreshing } = usePullToRefresh(reloadAll, { enabled: booted });

  /* ---- FX ---- */
  const refreshFx = useCallback(async (force = true) => {
    const fresh = await ensureFxRates(force);
    setFx(fresh);
    if (fresh.source === 'frankfurter') flashToast('Kurlar güncellendi', 'success');
    else if (fresh.source === 'manual') flashToast('Manuel kurlar kaydedildi', 'success');
    else if (fresh.source.endsWith('_stale')) flashToast('Çevrimdışı: son bilinen kur kullanılıyor', 'warn');
    else flashToast('Kurlar alınamadı, fallback kullanılıyor', 'warn');
    return fresh;
  }, [flashToast]);

  /* ---- Accounts ---- */
  const upsertAccount = useCallback(async (acc) => {
    const exists = accounts.some(a => a.id === acc.id);
    if (await runApi(() => api.upsertAccount(acc))) {
      setAccounts(exists ? accounts.map(a => a.id === acc.id ? acc : a) : [...accounts, acc]);
      flashToast(exists ? 'Hesap güncellendi' : 'Hesap eklendi', 'success');
    }
  }, [accounts, runApi, flashToast]);

  const deleteAccount = useCallback(async (id) => {
    if (txs.some(t => t.accountId === id)) {
      flashToast('Bu hesapta işlem var, önce taşıyın', 'warn');
      return;
    }
    if (await runApi(() => api.deleteAccount(id))) {
      setAccounts(accounts.filter(a => a.id !== id));
      flashToast('Hesap silindi', 'success');
    }
  }, [accounts, txs, runApi, flashToast]);

  /* ---- Transactions ---- */
  const upsertTx = useCallback(async (tx) => {
    const exists = txs.some(t => t.id === tx.id);
    if (await runApi(() => api.upsertTransaction(tx))) {
      setTxs(exists ? txs.map(t => t.id === tx.id ? tx : t) : [...txs, tx]);
      flashToast(exists ? 'İşlem güncellendi' : 'İşlem eklendi', 'success');
    }
  }, [txs, runApi, flashToast]);

  const deleteTx = useCallback(async (id) => {
    const original = txs.find(t => t.id === id);
    if (await runApi(() => api.deleteTransaction(id))) {
      setTxs(txs.filter(t => t.id !== id));
      flashToast('İşlem silindi', 'success', original ? {
        actionLabel: 'Geri al',
        onAction: async () => {
          if (await runApi(() => api.upsertTransaction(original))) {
            setTxs(curr => [...curr, original]);
            flashToast('İşlem geri yüklendi', 'success');
          }
        },
      } : undefined);
    }
  }, [txs, runApi, flashToast]);

  const transferBetween = useCallback(async ({ fromId, toId, amount, date, note }) => {
    const from = getAccount(accounts, fromId);
    const to = getAccount(accounts, toId);
    if (!from || !to) return;
    const transferId = uid('xfr');
    const fxRateFrom = from.currency === 'TRY' ? 1 : (fx.rates[from.currency] || 0);
    const fxRateTo = to.currency === 'TRY' ? 1 : (fx.rates[to.currency] || 0);
    const amountTRY = amount * fxRateFrom;
    const amountTo = fxRateTo ? amountTRY / fxRateTo : amount;

    const out = {
      id: uid('tx'), type: 'gider', accountId: fromId, category: 'diger',
      amount, currency: from.currency, fxRate: fxRateFrom, amountTRY, date,
      note: note || `Transfer → ${to.name}`, source: 'transfer', transferId,
      status: 'paid', createdAt: Date.now(),
    };
    const inn = {
      id: uid('tx'), type: 'gelir', accountId: toId, category: 'diger_g',
      amount: Number(amountTo.toFixed(2)), currency: to.currency, fxRate: fxRateTo, amountTRY, date,
      note: note || `Transfer ← ${from.name}`, source: 'transfer', transferId,
      status: 'paid', createdAt: Date.now(),
    };
    if (await runApi(() => api.bulkInsertTransactions([out, inn]))) {
      setTxs([...txs, out, inn]);
      flashToast('Transfer kaydedildi', 'success');
    }
  }, [accounts, txs, fx, runApi, flashToast]);

  /* ---- Recurring ---- */
  const upsertRule = useCallback(async (rule) => {
    const exists = recurring.some(r => r.id === rule.id);
    if (await runApi(() => api.upsertRule(rule))) {
      setRecurring(exists ? recurring.map(r => r.id === rule.id ? rule : r) : [...recurring, rule]);
      flashToast(exists ? 'Tekrar güncellendi' : 'Tekrar eklendi', 'success');
    }
  }, [recurring, runApi, flashToast]);

  const deleteRule = useCallback(async (id) => {
    const original = recurring.find(r => r.id === id);
    if (await runApi(() => api.deleteRule(id))) {
      setRecurring(recurring.filter(r => r.id !== id));
      flashToast('Tekrar silindi', 'success', original ? {
        actionLabel: 'Geri al',
        onAction: async () => {
          if (await runApi(() => api.upsertRule(original))) {
            setRecurring(curr => [...curr, original]);
            flashToast('Tekrar geri yüklendi', 'success');
          }
        },
      } : undefined);
    }
  }, [recurring, runApi, flashToast]);

  const toggleRule = useCallback(async (id) => {
    const rule = recurring.find(r => r.id === id);
    if (!rule) return;
    const next = { ...rule, active: !rule.active };
    if (await runApi(() => api.upsertRule(next))) {
      setRecurring(recurring.map(r => r.id === id ? next : r));
    }
  }, [recurring, runApi]);

  /* ---- Budgets ---- */
  const upsertBudget = useCallback(async (goal) => {
    const exists = budgets.some(b => b.id === goal.id);
    if (await runApi(() => api.upsertGoal(goal))) {
      setBudgets(exists ? budgets.map(b => b.id === goal.id ? goal : b) : [...budgets, goal]);
      flashToast(exists ? 'Hedef güncellendi' : 'Hedef eklendi', 'success');
    }
  }, [budgets, runApi, flashToast]);

  const deleteBudget = useCallback(async (id) => {
    const original = budgets.find(b => b.id === id);
    if (await runApi(() => api.deleteGoal(id))) {
      setBudgets(budgets.filter(b => b.id !== id));
      flashToast('Hedef silindi', 'success', original ? {
        actionLabel: 'Geri al',
        onAction: async () => {
          if (await runApi(() => api.upsertGoal(original))) {
            setBudgets(curr => [...curr, original]);
            flashToast('Hedef geri yüklendi', 'success');
          }
        },
      } : undefined);
    }
  }, [budgets, runApi, flashToast]);

  /* ---- Loans ---- */
  const upsertLoan = useCallback(async (loan) => {
    const exists = loans.some(l => l.id === loan.id);
    if (await runApi(() => api.upsertLoan(loan))) {
      setLoans(exists ? loans.map(l => l.id === loan.id ? loan : l) : [...loans, loan]);
      flashToast(exists ? 'Kredi güncellendi' : 'Kredi eklendi', 'success');
    }
  }, [loans, runApi, flashToast]);

  const deleteLoan = useCallback(async (id) => {
    const original = loans.find(l => l.id === id);
    if (await runApi(() => api.deleteLoan(id))) {
      setLoans(loans.filter(l => l.id !== id));
      flashToast('Kredi silindi', 'success', original ? {
        actionLabel: 'Geri al',
        onAction: async () => {
          if (await runApi(() => api.upsertLoan(original))) {
            setLoans(curr => [...curr, original]);
            flashToast('Kredi geri yüklendi', 'success');
          }
        },
      } : undefined);
    }
  }, [loans, runApi, flashToast]);

  // Pay the next installment: insert the gider tx AND advance the counter atomically
  // (from the user's POV) under runApi. If either Supabase call fails, local state
  // stays consistent because we only setState after both succeed.
  const payLoanInstallment = useCallback(async (loan) => {
    if (loan.installmentsPaid >= loan.installmentCount) {
      flashToast('Bu kredinin tüm taksitleri ödendi', 'warn');
      return;
    }
    const acc = getAccount(accounts, loan.accountId);
    if (!acc) { flashToast('Kredi ödeme hesabı bulunamadı', 'warn'); return; }
    const installmentNo = loan.installmentsPaid + 1;
    const fxRate = acc.currency === 'TRY' ? 1 : (fx.rates[acc.currency] || 1);
    const tx = {
      id: uid('tx'),
      type: 'gider',
      accountId: loan.accountId,
      category: loan.category || 'fatura',
      amount: loan.monthlyPayment,
      currency: acc.currency,
      fxRate,
      amountTRY: loan.monthlyPayment * fxRate,
      date: todayStr(),
      note: `${loan.name} · ${installmentNo}/${loan.installmentCount}. taksit`,
      source: 'loan',
      sourceId: loan.id,
      installmentNo,
      status: 'paid',
      createdAt: Date.now(),
    };
    const nextLoan = { ...loan, installmentsPaid: installmentNo };

    const ok = await runApi(async () => {
      await api.bulkInsertTransactions([tx]);
      await api.upsertLoan(nextLoan);
    });
    if (ok) {
      setTxs([tx, ...txs]);
      setLoans(loans.map(l => l.id === loan.id ? nextLoan : l));
      flashToast(`${installmentNo}/${loan.installmentCount}. taksit ödendi`, 'success');
    }
  }, [accounts, loans, txs, fx, runApi, flashToast]);

  if (bootError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50 p-6">
        <div className="max-w-md text-center text-stone-700">
          <AlertTriangle className="w-10 h-10 text-rose-600 mx-auto mb-3" />
          <h1 className="text-lg font-semibold mb-2">Veri yüklenemedi</h1>
          <p className="text-sm text-stone-500 mb-3">{bootError}</p>
          <p className="text-xs text-stone-500">
            Supabase tablo şeması <code>supabase/schema.sql</code> çalıştırıldı mı? RLS aktif olmalı.
          </p>
          <button onClick={() => window.location.reload()} className="mt-4 px-4 py-2 rounded-lg bg-amber-600 text-white text-sm">
            Tekrar dene
          </button>
        </div>
      </div>
    );
  }
  if (!booted) {
    // Show real layout + skeleton placeholders instead of a blank spinner,
    // so the first paint feels structured rather than empty.
    return (
      <div className="min-h-screen bg-stone-50 text-stone-800 pb-nav">
        <Header setView={setView} fx={fx} onRefreshFx={() => refreshFx(true)} />
        <main className="max-w-5xl mx-auto px-4 py-6">
          <DashboardSkeleton />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 text-stone-800 pb-nav">
      {/* Pull-to-refresh spinner — visible while user is dragging or
          the reload is in flight. Positioned below the sticky header. */}
      {(pull > 0 || refreshing) && (
        <div
          className="fixed top-14 left-1/2 -translate-x-1/2 z-40 pt-safe pointer-events-none"
          style={{ opacity: Math.min(1, pull / 60) }}
        >
          <div className="bg-white rounded-full shadow-card p-2 border border-stone-100">
            <RefreshCw
              className={`w-4 h-4 text-amber-600 ${refreshing ? 'animate-spin' : ''}`}
              style={!refreshing ? { transform: `rotate(${pull * 3}deg)` } : undefined}
            />
          </div>
        </div>
      )}
      <Header setView={setView} fx={fx} onRefreshFx={() => refreshFx(true)} />
      <main className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        {view.name === 'dashboard' && (
          <Dashboard
            accounts={accounts} txs={txs} recurring={recurring} budgets={budgets} fx={fx}
            setView={setView}
            onAdd={() => setModal({ kind: 'tx', payload: null })}
            onTransfer={() => setModal({ kind: 'transfer' })}
          />
        )}
        {view.name === 'accounts' && (
          <AccountsPage
            accounts={accounts} txs={txs} fx={fx}
            onAdd={() => setModal({ kind: 'account', payload: null })}
            onEdit={(a) => setModal({ kind: 'account', payload: a })}
            onDelete={deleteAccount}
            onOpen={(a) => a.type === 'kredi_karti' ? setView({ name: 'card', accountId: a.id }) : null}
          />
        )}
        {view.name === 'transactions' && (
          <TransactionsPage
            accounts={accounts} txs={txs} fx={fx}
            initialStatus={view.filter || 'all'}
            onAdd={() => setModal({ kind: 'tx', payload: null })}
            onEdit={(t) => setModal({ kind: 'tx', payload: t })}
            onDelete={deleteTx}
            onMarkPaid={async (t) => { await upsertTx({ ...t, status: 'paid', date: todayStr() }); }}
          />
        )}
        {view.name === 'recurring' && (
          <RecurringPage
            rules={recurring} accounts={accounts}
            onAdd={() => setModal({ kind: 'recurring', payload: null })}
            onEdit={(r) => setModal({ kind: 'recurring', payload: r })}
            onDelete={deleteRule}
            onToggle={toggleRule}
          />
        )}
        {view.name === 'budgets' && (
          <BudgetsPage
            budgets={budgets} txs={txs} fx={fx}
            onAdd={() => setModal({ kind: 'budget', payload: null })}
            onEdit={(g) => setModal({ kind: 'budget', payload: g })}
            onDelete={deleteBudget}
          />
        )}
        {view.name === 'loans' && (
          <LoansPage
            loans={loans} accounts={accounts} txs={txs}
            onAdd={() => setModal({ kind: 'loan', payload: null })}
            onEdit={(l) => setModal({ kind: 'loan', payload: l })}
            onDelete={deleteLoan}
            onPay={payLoanInstallment}
          />
        )}
        {view.name === 'card' && (
          <CardCyclePage
            accountId={view.accountId}
            accounts={accounts} txs={txs} fx={fx}
            onBack={() => setView({ name: 'accounts' })}
            onPayCycle={(preset) => setModal({ kind: 'transfer', payload: preset })}
          />
        )}
        {view.name === 'settings' && (
          <SettingsPage
            fx={fx}
            session={session}
            onRefresh={() => refreshFx(true)}
            onManual={async (r) => { const fresh = await saveManualRates(r); setFx(fresh); flashToast('Manuel kurlar kaydedildi', 'success'); }}
            onLogout={async () => { await supabase.auth.signOut(); }}
          />
        )}
      </main>

      <BottomNav view={view} setView={setView} onQuickAdd={() => setModal({ kind: 'tx', payload: null })} />

      {modal?.kind === 'tx' && (
        <TxModal
          tx={modal.payload}
          accounts={accounts}
          fx={fx}
          onClose={() => setModal(null)}
          onSave={async (t) => { await upsertTx(t); setModal(null); }}
          onDelete={modal.payload ? async () => { await deleteTx(modal.payload.id); setModal(null); } : null}
        />
      )}
      {modal?.kind === 'account' && (
        <AccountModal
          account={modal.payload}
          onClose={() => setModal(null)}
          onSave={async (a) => { await upsertAccount(a); setModal(null); }}
        />
      )}
      {modal?.kind === 'transfer' && (
        <TransferModal
          accounts={accounts}
          initial={modal.payload}
          onClose={() => setModal(null)}
          onSave={async (data) => { await transferBetween(data); setModal(null); }}
        />
      )}
      {modal?.kind === 'recurring' && (
        <RecurringModal
          rule={modal.payload}
          accounts={accounts}
          onClose={() => setModal(null)}
          onSave={async (r) => { await upsertRule(r); setModal(null); }}
        />
      )}
      {modal?.kind === 'budget' && (
        <BudgetModal
          goal={modal.payload}
          onClose={() => setModal(null)}
          onSave={async (g) => { await upsertBudget(g); setModal(null); }}
        />
      )}
      {modal?.kind === 'loan' && (
        <LoanModal
          loan={modal.payload}
          accounts={accounts}
          onClose={() => setModal(null)}
          onSave={async (l) => { await upsertLoan(l); setModal(null); }}
        />
      )}

      {/* Toast stack — newest at bottom (above the BottomNav). */}
      <div className="fixed bottom-24 inset-x-0 z-50 flex flex-col items-center gap-2 px-4 pointer-events-none">
        {toasts.map(t => (
          <div
            key={t.id}
            className={`pointer-events-auto max-w-md w-fit flex items-center gap-3 px-4 py-2.5 rounded-full shadow-lg text-sm font-medium animate-[slideup-toast_240ms_cubic-bezier(.2,.8,.2,1)] ${
              t.kind === 'success' ? 'bg-emerald-600 text-white' :
              t.kind === 'warn'    ? 'bg-amber-500 text-white' :
                                     'bg-stone-800 text-white'
            }`}
          >
            <span>{t.message}</span>
            {t.actionLabel && (
              <button
                onClick={() => { t.onAction?.(); dismissToast(t.id); }}
                className="px-2 py-0.5 rounded-full bg-white/20 hover:bg-white/30 text-white text-xs font-semibold"
              >
                {t.actionLabel}
              </button>
            )}
          </div>
        ))}
      </div>

      <style>{`
        @keyframes slideup-toast {
          from { opacity: 0; transform: translateY(20px) }
          to   { opacity: 1; transform: translateY(0) }
        }
      `}</style>
    </div>
  );
}
