-- Trap House Stripe Checkout storage
-- Run after supabase/trap_house_schema.sql in Supabase Dashboard > SQL Editor.
-- This supports direct Stripe Checkout Sessions only. No Stripe Connect tables,
-- connected accounts, seller onboarding, split payouts, or marketplace flows.

create extension if not exists pgcrypto;

create table if not exists public.stripe_events (
  id uuid primary key default gen_random_uuid(),
  stripe_event_id text unique not null,
  event_type text not null,
  livemode boolean not null default false,
  status text not null default 'received',
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.stripe_orders (
  id uuid primary key default gen_random_uuid(),
  stripe_checkout_session_id text unique not null,
  stripe_payment_intent_id text,
  stripe_customer_id text,
  stripe_subscription_id text,
  customer_email text,
  product_key text not null,
  product_name text not null,
  price_id text,
  lookup_key text,
  mode text not null,
  quantity integer not null default 1,
  amount_total integer,
  currency text,
  payment_status text,
  subscription_status text,
  fulfillment_type text,
  requires_shipping boolean not null default false,
  shipping_details jsonb,
  access_status text not null default 'pending',
  trap_pass_serial text,
  raw_session jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.stripe_subscriptions (
  id uuid primary key default gen_random_uuid(),
  stripe_subscription_id text unique not null,
  stripe_customer_id text,
  customer_email text,
  product_key text,
  lookup_key text,
  status text not null default 'unknown',
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  last_invoice_id text,
  raw_subscription jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.stripe_trap_pass_serial_counters (
  prefix text primary key,
  current_serial integer not null default 0,
  updated_at timestamptz not null default now()
);

create table if not exists public.stripe_trap_pass_entitlements (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references public.stripe_orders(id) on delete set null,
  stripe_checkout_session_id text unique not null,
  stripe_customer_id text,
  stripe_subscription_id text,
  customer_email text,
  product_key text not null,
  tier text not null,
  serial_number text unique not null,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists stripe_orders_customer_email_idx on public.stripe_orders (customer_email);
create index if not exists stripe_orders_product_key_idx on public.stripe_orders (product_key);
create index if not exists stripe_subscriptions_customer_email_idx on public.stripe_subscriptions (customer_email);
create index if not exists stripe_entitlements_customer_email_idx on public.stripe_trap_pass_entitlements (customer_email);
create index if not exists stripe_entitlements_subscription_idx on public.stripe_trap_pass_entitlements (stripe_subscription_id);

alter table public.stripe_events enable row level security;
alter table public.stripe_orders enable row level security;
alter table public.stripe_subscriptions enable row level security;
alter table public.stripe_trap_pass_serial_counters enable row level security;
alter table public.stripe_trap_pass_entitlements enable row level security;

revoke all on public.stripe_events from anon, authenticated;
revoke all on public.stripe_orders from anon, authenticated;
revoke all on public.stripe_subscriptions from anon, authenticated;
revoke all on public.stripe_trap_pass_serial_counters from anon, authenticated;
revoke all on public.stripe_trap_pass_entitlements from anon, authenticated;

create or replace function public.stripe_checkout_touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists stripe_events_touch_updated_at on public.stripe_events;
create trigger stripe_events_touch_updated_at
before update on public.stripe_events
for each row execute function public.stripe_checkout_touch_updated_at();

drop trigger if exists stripe_orders_touch_updated_at on public.stripe_orders;
create trigger stripe_orders_touch_updated_at
before update on public.stripe_orders
for each row execute function public.stripe_checkout_touch_updated_at();

drop trigger if exists stripe_subscriptions_touch_updated_at on public.stripe_subscriptions;
create trigger stripe_subscriptions_touch_updated_at
before update on public.stripe_subscriptions
for each row execute function public.stripe_checkout_touch_updated_at();

drop trigger if exists stripe_entitlements_touch_updated_at on public.stripe_trap_pass_entitlements;
create trigger stripe_entitlements_touch_updated_at
before update on public.stripe_trap_pass_entitlements
for each row execute function public.stripe_checkout_touch_updated_at();

create or replace function public.stripe_next_trap_pass_serial(p_prefix text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  clean_prefix text := upper(regexp_replace(coalesce(nullif(trim(p_prefix), ''), 'TP'), '[^A-Z0-9]+', '', 'g'));
  next_serial integer;
begin
  insert into public.stripe_trap_pass_serial_counters (prefix, current_serial)
  values (clean_prefix, 1)
  on conflict (prefix) do update
    set current_serial = public.stripe_trap_pass_serial_counters.current_serial + 1,
        updated_at = now()
  returning current_serial into next_serial;

  return clean_prefix || '-' || lpad(next_serial::text, 6, '0');
end;
$$;

revoke all on function public.stripe_next_trap_pass_serial(text) from anon, authenticated;

comment on table public.stripe_orders is 'Private Stripe Checkout order records for direct IHOCAIHAG sales only.';
comment on table public.stripe_subscriptions is 'Private Stripe subscription status records for Cash for Trash access.';
comment on table public.stripe_trap_pass_entitlements is 'Private Trap Pass ownership records created only from verified Stripe webhooks.';
comment on function public.stripe_next_trap_pass_serial(text) is 'Server-only helper for atomic Stripe Trap Pass serial generation.';
