-- Butce schema — run this in Supabase Dashboard > SQL Editor.
-- One-time setup. Re-running is safe (drops and recreates).

-- ============================================================
-- TABLES
-- ============================================================

drop table if exists public.budget_goals    cascade;
drop table if exists public.recurring_rules cascade;
drop table if exists public.transactions    cascade;
drop table if exists public.accounts        cascade;

create table public.accounts (
  id               text primary key,
  user_id          uuid not null references auth.users(id) on delete cascade,
  name             text not null,
  type             text not null check (type in ('nakit','banka','kredi_karti')),
  currency         text not null check (currency in ('TRY','USD','EUR')),
  color            text,
  initial_balance  numeric not null default 0,
  cutoff_day       int,
  payment_due_day  int,
  credit_limit     numeric,
  archived         boolean not null default false,
  created_at       bigint  not null default (extract(epoch from now()) * 1000)::bigint
);
create index accounts_user_idx on public.accounts (user_id);

create table public.transactions (
  id          text primary key,
  user_id     uuid not null references auth.users(id) on delete cascade,
  type        text not null check (type in ('gelir','gider')),
  account_id  text not null references public.accounts(id) on delete cascade,
  category    text not null,
  amount      numeric not null,
  currency    text not null check (currency in ('TRY','USD','EUR')),
  fx_rate     numeric,
  amount_try  numeric,
  date        text not null,           -- YYYY-MM-DD
  note        text,
  source      text,                    -- 'manual' | 'recurring' | 'transfer'
  source_id   text,
  transfer_id text,
  created_at  bigint not null default (extract(epoch from now()) * 1000)::bigint
);
create index transactions_user_date_idx on public.transactions (user_id, date desc);
create index transactions_account_idx   on public.transactions (account_id);

create table public.recurring_rules (
  id                   text primary key,
  user_id              uuid not null references auth.users(id) on delete cascade,
  name                 text not null,
  type                 text not null check (type in ('gelir','gider')),
  account_id           text not null references public.accounts(id) on delete cascade,
  category             text not null,
  amount               numeric not null,
  currency             text not null check (currency in ('TRY','USD','EUR')),
  frequency            text not null check (frequency in ('aylik','haftalik','yillik')),
  day_of_month         int,
  day_of_week          int,
  month_of_year        int,
  start_date           text not null,
  end_date             text,
  active               boolean not null default true,
  exceptions           jsonb   not null default '[]'::jsonb,
  last_generated_date  text,
  created_at           bigint  not null default (extract(epoch from now()) * 1000)::bigint
);
create index recurring_user_idx on public.recurring_rules (user_id);

create table public.budget_goals (
  id           text primary key,
  user_id      uuid not null references auth.users(id) on delete cascade,
  category     text not null,
  "limit"      numeric not null,
  created_at   bigint not null default (extract(epoch from now()) * 1000)::bigint
);
create index budget_user_idx on public.budget_goals (user_id);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table public.accounts        enable row level security;
alter table public.transactions    enable row level security;
alter table public.recurring_rules enable row level security;
alter table public.budget_goals    enable row level security;

-- Helper macro: same 4 policies for every table
do $$
declare
  t text;
begin
  foreach t in array array['accounts','transactions','recurring_rules','budget_goals'] loop
    execute format('drop policy if exists "own select" on public.%I', t);
    execute format('drop policy if exists "own insert" on public.%I', t);
    execute format('drop policy if exists "own update" on public.%I', t);
    execute format('drop policy if exists "own delete" on public.%I', t);
    execute format($f$create policy "own select" on public.%I for select using (auth.uid() = user_id)$f$, t);
    execute format($f$create policy "own insert" on public.%I for insert with check (auth.uid() = user_id)$f$, t);
    execute format($f$create policy "own update" on public.%I for update using (auth.uid() = user_id) with check (auth.uid() = user_id)$f$, t);
    execute format($f$create policy "own delete" on public.%I for delete using (auth.uid() = user_id)$f$, t);
  end loop;
end$$;
