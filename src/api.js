import { supabase } from './supabase.js';

// ============================================================
// Field mappings between JS (camelCase) and DB (snake_case)
// ============================================================

function accFromDb(r) {
  return {
    id: r.id,
    name: r.name,
    type: r.type,
    currency: r.currency,
    color: r.color,
    initialBalance: Number(r.initial_balance) || 0,
    cutoffDay: r.cutoff_day ?? undefined,
    paymentDueDay: r.payment_due_day ?? undefined,
    creditLimit: r.credit_limit != null ? Number(r.credit_limit) : undefined,
    archived: !!r.archived,
    createdAt: Number(r.created_at) || Date.now(),
  };
}
function accToDb(a, userId) {
  return {
    id: a.id,
    user_id: userId,
    name: a.name,
    type: a.type,
    currency: a.currency,
    color: a.color || null,
    initial_balance: a.initialBalance || 0,
    cutoff_day: a.cutoffDay ?? null,
    payment_due_day: a.paymentDueDay ?? null,
    credit_limit: a.creditLimit ?? null,
    archived: !!a.archived,
    created_at: a.createdAt || Date.now(),
  };
}

function txFromDb(r) {
  return {
    id: r.id,
    type: r.type,
    accountId: r.account_id,
    category: r.category,
    amount: Number(r.amount),
    currency: r.currency,
    fxRate: r.fx_rate != null ? Number(r.fx_rate) : 1,
    amountTRY: r.amount_try != null ? Number(r.amount_try) : Number(r.amount),
    date: r.date,
    note: r.note || '',
    source: r.source || 'manual',
    sourceId: r.source_id || undefined,
    transferId: r.transfer_id || undefined,
    status: r.status || 'paid',
    installmentNo: r.installment_no ?? undefined,
    createdAt: Number(r.created_at) || Date.now(),
  };
}
function txToDb(t, userId) {
  return {
    id: t.id,
    user_id: userId,
    type: t.type,
    account_id: t.accountId,
    category: t.category,
    amount: t.amount,
    currency: t.currency,
    fx_rate: t.fxRate ?? 1,
    amount_try: t.amountTRY ?? t.amount,
    date: t.date,
    note: t.note || null,
    source: t.source || 'manual',
    source_id: t.sourceId || null,
    transfer_id: t.transferId || null,
    status: t.status || 'paid',
    installment_no: t.installmentNo ?? null,
    created_at: t.createdAt || Date.now(),
  };
}

function ruleFromDb(r) {
  return {
    id: r.id,
    name: r.name,
    type: r.type,
    accountId: r.account_id,
    category: r.category,
    amount: Number(r.amount),
    currency: r.currency,
    frequency: r.frequency,
    dayOfMonth: r.day_of_month ?? undefined,
    dayOfWeek: r.day_of_week ?? undefined,
    monthOfYear: r.month_of_year ?? undefined,
    startDate: r.start_date,
    endDate: r.end_date || null,
    active: !!r.active,
    exceptions: r.exceptions || [],
    lastGeneratedDate: r.last_generated_date || null,
    createdAt: Number(r.created_at) || Date.now(),
  };
}
function ruleToDb(r, userId) {
  return {
    id: r.id,
    user_id: userId,
    name: r.name,
    type: r.type,
    account_id: r.accountId,
    category: r.category,
    amount: r.amount,
    currency: r.currency,
    frequency: r.frequency,
    day_of_month: r.dayOfMonth ?? null,
    day_of_week: r.dayOfWeek ?? null,
    month_of_year: r.monthOfYear ?? null,
    start_date: r.startDate,
    end_date: r.endDate || null,
    active: !!r.active,
    exceptions: r.exceptions || [],
    last_generated_date: r.lastGeneratedDate || null,
    created_at: r.createdAt || Date.now(),
  };
}

function loanFromDb(r) {
  return {
    id: r.id,
    name: r.name,
    lender: r.lender || '',
    accountId: r.account_id,
    totalAmount: Number(r.total_amount),
    installmentCount: Number(r.installment_count),
    monthlyPayment: Number(r.monthly_payment),
    firstPaymentDate: r.first_payment_date,
    installmentsPaid: Number(r.installments_paid) || 0,
    category: r.category || 'fatura',
    currency: r.currency || 'TRY',
    notes: r.notes || '',
    archived: !!r.archived,
    createdAt: Number(r.created_at) || Date.now(),
  };
}
function loanToDb(l, userId) {
  return {
    id: l.id,
    user_id: userId,
    name: l.name,
    lender: l.lender || null,
    account_id: l.accountId,
    total_amount: l.totalAmount,
    installment_count: l.installmentCount,
    monthly_payment: l.monthlyPayment,
    first_payment_date: l.firstPaymentDate,
    installments_paid: l.installmentsPaid || 0,
    category: l.category || 'fatura',
    currency: l.currency || 'TRY',
    notes: l.notes || null,
    archived: !!l.archived,
    created_at: l.createdAt || Date.now(),
  };
}

function goalFromDb(r) {
  return {
    id: r.id,
    category: r.category,
    limit: Number(r.limit),
    createdAt: Number(r.created_at) || Date.now(),
  };
}
function goalToDb(g, userId) {
  return {
    id: g.id,
    user_id: userId,
    category: g.category,
    limit: g.limit,
    created_at: g.createdAt || Date.now(),
  };
}

// ============================================================
// CRUD helpers
// ============================================================

async function getUserId() {
  const { data } = await supabase.auth.getUser();
  return data?.user?.id;
}

export const api = {
  // accounts
  async listAccounts() {
    const { data, error } = await supabase.from('accounts').select('*').order('created_at');
    if (error) throw error;
    return (data || []).map(accFromDb);
  },
  async upsertAccount(a) {
    const userId = await getUserId();
    const { error } = await supabase.from('accounts').upsert(accToDb(a, userId));
    if (error) throw error;
  },
  async deleteAccount(id) {
    const { error } = await supabase.from('accounts').delete().eq('id', id);
    if (error) throw error;
  },

  // transactions
  async listTransactions() {
    const { data, error } = await supabase.from('transactions').select('*').order('date', { ascending: false });
    if (error) throw error;
    return (data || []).map(txFromDb);
  },
  async upsertTransaction(t) {
    const userId = await getUserId();
    const { error } = await supabase.from('transactions').upsert(txToDb(t, userId));
    if (error) throw error;
  },
  async deleteTransaction(id) {
    const { error } = await supabase.from('transactions').delete().eq('id', id);
    if (error) throw error;
  },
  async bulkInsertTransactions(rows) {
    if (!rows.length) return;
    const userId = await getUserId();
    const { error } = await supabase.from('transactions').insert(rows.map(t => txToDb(t, userId)));
    if (error) throw error;
  },

  // recurring rules
  async listRules() {
    const { data, error } = await supabase.from('recurring_rules').select('*').order('created_at');
    if (error) throw error;
    return (data || []).map(ruleFromDb);
  },
  async upsertRule(r) {
    const userId = await getUserId();
    const { error } = await supabase.from('recurring_rules').upsert(ruleToDb(r, userId));
    if (error) throw error;
  },
  async deleteRule(id) {
    const { error } = await supabase.from('recurring_rules').delete().eq('id', id);
    if (error) throw error;
  },

  // loans
  async listLoans() {
    // Tolerant: if the loans table is missing (migration not yet run), default to [].
    try {
      const { data, error } = await supabase.from('loans').select('*').order('created_at');
      if (error) throw error;
      return (data || []).map(loanFromDb);
    } catch (e) {
      console.warn('[loans] list failed — run supabase/migrations/002_payment_features.sql for full functionality:', e?.message || e);
      return [];
    }
  },
  async upsertLoan(l) {
    const userId = await getUserId();
    const { error } = await supabase.from('loans').upsert(loanToDb(l, userId));
    if (error) throw error;
  },
  async deleteLoan(id) {
    const { error } = await supabase.from('loans').delete().eq('id', id);
    if (error) throw error;
  },

  // budget goals
  async listGoals() {
    const { data, error } = await supabase.from('budget_goals').select('*').order('created_at');
    if (error) throw error;
    return (data || []).map(goalFromDb);
  },
  async upsertGoal(g) {
    const userId = await getUserId();
    const { error } = await supabase.from('budget_goals').upsert(goalToDb(g, userId));
    if (error) throw error;
  },
  async deleteGoal(id) {
    const { error } = await supabase.from('budget_goals').delete().eq('id', id);
    if (error) throw error;
  },
};
