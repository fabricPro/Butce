-- Butce migration 002: Payment closure + pending status + loan tracking
-- Run this in Supabase SQL Editor ONCE on top of existing schema.sql.
-- Additive only — does NOT drop or recreate anything. Safe to re-run.

-- ============================================================
-- 1) transactions.status — pending/paid
-- ============================================================
-- Used for Feature #2 ("Bekleyen" işlemler). Existing rows default to 'paid'
-- so balances remain unchanged. New rows can be 'pending' (excluded from balance).

alter table public.transactions
  add column if not exists status text not null default 'paid'
  check (status in ('paid', 'pending'));

create index if not exists transactions_status_idx
  on public.transactions (user_id, status);

-- ============================================================
-- 2) loans — installment-based loan tracking
-- ============================================================
-- Used for Feature #4. Each loan represents a fixed-installment debt
-- (mortgage, consumer loan, etc.). Individual installment payments are
-- regular transactions with source='loan' and source_id=loan.id.

create table if not exists public.loans (
  id                  text primary key,
  user_id             uuid not null references auth.users(id) on delete cascade,
  name                text not null,
  lender              text,
  account_id          text not null references public.accounts(id) on delete cascade,
  total_amount        numeric not null,
  installment_count   int    not null check (installment_count > 0),
  monthly_payment     numeric not null,
  first_payment_date  text   not null,  -- YYYY-MM-DD
  installments_paid   int    not null default 0,
  category            text   not null default 'fatura',
  currency            text   not null default 'TRY' check (currency in ('TRY','USD','EUR')),
  notes               text,
  archived            boolean not null default false,
  created_at          bigint not null default (extract(epoch from now()) * 1000)::bigint
);

create index if not exists loans_user_idx on public.loans (user_id);

alter table public.loans enable row level security;

drop policy if exists "own select" on public.loans;
drop policy if exists "own insert" on public.loans;
drop policy if exists "own update" on public.loans;
drop policy if exists "own delete" on public.loans;

create policy "own select" on public.loans for select using  (auth.uid() = user_id);
create policy "own insert" on public.loans for insert with check (auth.uid() = user_id);
create policy "own update" on public.loans for update using  (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own delete" on public.loans for delete using  (auth.uid() = user_id);

-- ============================================================
-- 3) transactions.installment_no — link payment to specific installment
-- ============================================================
-- Optional pointer: which installment (1..installment_count) this tx pays.
-- Lets us show "5/12 paid" reliably even after retroactive edits.

alter table public.transactions
  add column if not exists installment_no int;

-- Done.
