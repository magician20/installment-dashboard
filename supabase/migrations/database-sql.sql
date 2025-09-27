-- Enable required extension for UUID generation
create extension if not exists pgcrypto;

-- ─────────────────────────────────────────────────────────────────────────────
-- Drop in dependency order (safe if empty)
-- ─────────────────────────────────────────────────────────────────────────────
drop function if exists public.process_payment(uuid,numeric,text,uuid,text,text) cascade;
drop function if exists public.create_installments_for_order(uuid,uuid,date) cascade;
drop function if exists public.refresh_installment_late_status(uuid) cascade;
drop function if exists public.update_overdue_installments() cascade;

drop table if exists public.order_items cascade;
drop table if exists public.payments cascade;
drop table if exists public.installments cascade;
drop table if exists public.orders cascade;
drop table if exists public.products cascade;
drop table if exists public.categories cascade;
drop table if exists public.installment_plans cascade;
drop table if exists public.customers cascade;

-- ─────────────────────────────────────────────────────────────────────────────
-- Helper functions: timestamps + owner auto-fill
-- ─────────────────────────────────────────────────────────────────────────────
create or replace function public.set_timestamps()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'INSERT' then
    if new.created_at is null then
      new.created_at := now();
    end if;
    new.updated_at := now();
  elsif tg_op = 'UPDATE' then
    new.updated_at := now();
  end if;
  return new;
end;
$$;

create or replace function public.set_owner_id()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.user_id is null then
    new.user_id := auth.uid();
  end if;
  return new;
end;
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- Tables (all rows carry user_id)
-- ─────────────────────────────────────────────────────────────────────────────

-- Categories
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (user_id, name)
);

-- Products
create table public.products (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  description text,
  price numeric(12,2) not null,
  quantity integer not null default 0,
  category_id uuid not null references public.categories(id) on delete cascade,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (user_id, name)
);

-- Customers
create table public.customers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  first_name text not null,
  last_name text not null,
  email text not null,
  phone_number text,
  address text,
  identity_number text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Installment Plans
create table public.installment_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  plan_type text not null check (plan_type in ('fixed','flexible')),
  duration integer not null,                       -- months
  interest_rate numeric(5,2) not null default 0,   -- %
  grace_period integer not null default 0,         -- days
  advance_payment_amount numeric(12,2),            -- nullable
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Orders
create table public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  customer_id uuid not null references public.customers(id) on delete cascade,
  order_date date not null default current_date,
  status text not null default 'pending',
  total_amount numeric(12,2) not null,
  payment_method text not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Order Items
create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete restrict,
  quantity integer not null,
  unit_price numeric(12,2) not null,
  total_price numeric(12,2) not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Installments
-- Note: installment_number is text to match the current app types
create table public.installments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  order_id uuid not null references public.orders(id) on delete cascade,
  installment_plan_id uuid not null references public.installment_plans(id) on delete cascade,
  installment_number text not null,
  due_date date not null,
  amount numeric(12,2) not null,
  status text not null default 'pending',          -- pending | paid | late
  late_fee numeric(12,2) default 0,
  payment_date date,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Payments
create table public.payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  order_id uuid references public.orders(id) on delete set null,
  installment_id uuid references public.installments(id) on delete set null,
  amount numeric(12,2) not null,
  payment_date date not null default current_date,
  payment_method text not null,
  reference_number text,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ─────────────────────────────────────────────────────────────────────────────
-- Indexes
-- ─────────────────────────────────────────────────────────────────────────────
create index if not exists idx_categories_user on public.categories(user_id);
create index if not exists idx_products_user on public.products(user_id);
create index if not exists idx_customers_user on public.customers(user_id);
create index if not exists idx_installment_plans_user on public.installment_plans(user_id);
create index if not exists idx_orders_user on public.orders(user_id);
create index if not exists idx_order_items_user on public.order_items(user_id);
create index if not exists idx_installments_user on public.installments(user_id);
create index if not exists idx_payments_user on public.payments(user_id);

-- Helpful FKs/filters for joins + performance
create index if not exists idx_products_category on public.products(category_id);
create index if not exists idx_orders_customer on public.orders(customer_id);
create index if not exists idx_items_order on public.order_items(order_id);
create index if not exists idx_items_product on public.order_items(product_id);
create index if not exists idx_installments_order on public.installments(order_id);
create index if not exists idx_installments_plan on public.installments(installment_plan_id);
create index if not exists idx_payments_order on public.payments(order_id);
create index if not exists idx_payments_installment on public.payments(installment_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- Triggers: timestamps + owner auto-fill
-- ─────────────────────────────────────────────────────────────────────────────
-- helper to attach both triggers
do $$
declare
  t text;
begin
  foreach t in array array[
    'categories','products','customers','installment_plans',
    'orders','order_items','installments','payments'
  ]
  loop
    execute format('drop trigger if exists %I_set_ts on public.%I', t, t);
    execute format('create trigger %I_set_ts before insert or update on public.%I for each row execute function public.set_timestamps()', t, t);

    execute format('drop trigger if exists %I_set_owner on public.%I', t, t);
    execute format('create trigger %I_set_owner before insert on public.%I for each row execute function public.set_owner_id()', t, t);
  end loop;
end $$;

-- ─────────────────────────────────────────────────────────────────────────────
-- Row Level Security (owner-only CRUD on every table)
-- ─────────────────────────────────────────────────────────────────────────────
do $$
declare
  t text;
begin
  foreach t in array array[
    'categories','products','customers','installment_plans',
    'orders','order_items','installments','payments'
  ]
  loop
    execute format('alter table public.%I enable row level security', t);

    execute format('drop policy if exists "%I_select_own" on public.%I', t, t);
    execute format('drop policy if exists "%I_insert_own" on public.%I', t, t);
    execute format('drop policy if exists "%I_update_own" on public.%I', t, t);
    execute format('drop policy if exists "%I_delete_own" on public.%I', t, t);

    execute format('create policy "%I_select_own" on public.%I for select using (user_id = auth.uid())', t, t);
    execute format('create policy "%I_insert_own" on public.%I for insert with check (user_id = auth.uid())', t, t);
    execute format('create policy "%I_update_own" on public.%I for update using (user_id = auth.uid()) with check (user_id = auth.uid())', t, t);
    execute format('create policy "%I_delete_own" on public.%I for delete using (user_id = auth.uid())', t, t);
  end loop;
end $$;

-- ─────────────────────────────────────────────────────────────────────────────
-- RPCs used by the app (SECURITY INVOKER so RLS applies)
-- ─────────────────────────────────────────────────────────────────────────────

-- Create installments for an order (simple generator for fixed plans)
create or replace function public.create_installments_for_order(
  p_order_id uuid,
  p_plan_id uuid,
  p_start_date date
) returns json
language plpgsql
security invoker
as $$
declare
  v_user uuid := auth.uid();
  v_duration int;
  v_amount_per numeric(12,2);
  v_total numeric(12,2);
  i int;
begin
  -- basic ownership checks via RLS (selects will be filtered if not owner)
  select duration into v_duration from public.installment_plans
   where id = p_plan_id and user_id = v_user;

  select total_amount into v_total from public.orders
   where id = p_order_id and user_id = v_user;

  if v_duration is null or v_total is null then
    return json_build_object('success', false, 'message', 'not found or not owner');
  end if;

  v_amount_per := round((v_total / v_duration)::numeric, 2);

  for i in 1..v_duration loop
    insert into public.installments (
      user_id, order_id, installment_plan_id, installment_number, due_date, amount, status
    ) values (
      v_user, p_order_id, p_plan_id, i::text, (p_start_date + (i-1) * interval '1 month')::date, v_amount_per, 'pending'
    );
  end loop;

  return json_build_object('success', true, 'count', v_duration);
end;
$$;

-- Mark late if overdue helper
create or replace function public.refresh_installment_late_status(
  p_installment_id uuid
) returns json
language plpgsql
security invoker
as $$
declare
  v_status text;
  v_due date;
begin
  select status, due_date into v_status, v_due
  from public.installments where id = p_installment_id;

  if v_status is null then
    return json_build_object('success', false, 'message', 'not found');
  end if;

  if v_status <> 'paid' and v_due < current_date then
    update public.installments set status = 'late' where id = p_installment_id;
  end if;

  return json_build_object('success', true);
end;
$$;

-- Bulk overdue updater
create or replace function public.update_overdue_installments()
returns int
language plpgsql
security invoker
as $$
declare
  v_cnt int;
begin
  update public.installments
     set status = 'late'
   where status <> 'paid' and due_date < current_date
     and user_id = auth.uid();
  get diagnostics v_cnt = row_count;
  return v_cnt;
end;
$$;

-- Payment processing for an installment
-- Returns { success, payment_id, remaining_amount }
create or replace function public.process_payment(
  p_order_id uuid,
  p_amount numeric,
  p_payment_method text,
  p_installment_id uuid,
  p_reference_number text default null,
  p_notes text default null
) returns json
language plpgsql
security invoker
as $$
declare
  v_user uuid := auth.uid();
  v_inst_amount numeric(12,2);
  v_already_paid numeric(12,2);
  v_remaining numeric(12,2);
  v_payment_id uuid;
begin
  select amount into v_inst_amount
  from public.installments
  where id = p_installment_id and user_id = v_user;

  if v_inst_amount is null then
    return json_build_object('success', false, 'message', 'installment not found or not owner');
  end if;

  select coalesce(sum(amount),0) into v_already_paid
  from public.payments
  where installment_id = p_installment_id and user_id = v_user;

  v_remaining := greatest(v_inst_amount - v_already_paid - p_amount, 0);

  insert into public.payments (user_id, order_id, installment_id, amount, payment_date, payment_method, reference_number, notes)
  values (v_user, p_order_id, p_installment_id, p_amount, current_date, p_payment_method, p_reference_number, p_notes)
  returning id into v_payment_id;

  if v_remaining = 0 then
    update public.installments set status = 'paid', payment_date = current_date
    where id = p_installment_id and user_id = v_user;
  end if;

  return json_build_object('success', true, 'payment_id', v_payment_id, 'remaining_amount', v_remaining);
end;
$$;