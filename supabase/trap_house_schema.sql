-- Trap House Supabase setup
-- Run this once in Supabase Dashboard > SQL Editor.
-- It stores entry emails and real Trap Pass claims without exposing private
-- email or wallet fields through public browser code.

create extension if not exists pgcrypto;

create table if not exists public.email_captures (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  email_normalized text generated always as (lower(trim(email))) stored,
  source text not null default 'entry_gate',
  page_path text,
  user_agent text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists email_captures_unique_source_idx
  on public.email_captures (email_normalized, source);

create table if not exists public.trap_pass_wave_counters (
  wave_number integer primary key,
  current_serial integer not null default 0,
  updated_at timestamptz not null default now()
);

create table if not exists public.trap_passes (
  id uuid primary key default gen_random_uuid(),
  trap_pass_id text unique not null,
  wave_number integer not null default 3,
  wave_name text not null default 'All Hands On Deck',
  serial_number integer not null,
  email text not null,
  email_normalized text generated always as (lower(trim(email))) stored,
  display_name text not null default 'New Arrival',
  discord_username text,
  wallet_address text,
  discord_role text not null default 'All Hands On Deck',
  status text not null default 'active',
  missions_completed integer not null default 0,
  unlock_level integer not null default 1,
  thread_keys text[] not null default array['trap-pass-lore', 'public-project-witness'],
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  future_unlock_data jsonb not null default '{}'::jsonb
);

create unique index if not exists trap_passes_unique_email_idx
  on public.trap_passes (email_normalized);

create unique index if not exists trap_passes_wave_serial_idx
  on public.trap_passes (wave_number, serial_number);

alter table public.email_captures enable row level security;
alter table public.trap_pass_wave_counters enable row level security;
alter table public.trap_passes enable row level security;

revoke all on public.email_captures from anon, authenticated;
revoke all on public.trap_pass_wave_counters from anon, authenticated;
revoke all on public.trap_passes from anon, authenticated;

create or replace function public.trap_house_touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists email_captures_touch_updated_at on public.email_captures;
create trigger email_captures_touch_updated_at
before update on public.email_captures
for each row execute function public.trap_house_touch_updated_at();

drop trigger if exists trap_passes_touch_updated_at on public.trap_passes;
create trigger trap_passes_touch_updated_at
before update on public.trap_passes
for each row execute function public.trap_house_touch_updated_at();

create or replace function public.trap_house_clean_text(value text, max_len integer default 160)
returns text
language sql
immutable
as $$
  select left(trim(regexp_replace(coalesce(value, ''), '[<>[:cntrl:]]', '', 'g')), greatest(max_len, 0));
$$;

create or replace function public.trap_house_is_email(value text)
returns boolean
language sql
immutable
as $$
  select coalesce(value, '') ~* '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$';
$$;

create or replace function public.trap_house_normalize_email(value text)
returns text
language sql
immutable
as $$
  select lower(public.trap_house_clean_text(value, 220));
$$;

create or replace function public.trap_house_normalize_pass_id(value text)
returns text
language sql
immutable
as $$
  select upper(regexp_replace(public.trap_house_clean_text(value, 40), '\s+', '', 'g'));
$$;

create or replace function public.trap_house_public_pass(pass_row public.trap_passes)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'trap_pass_id', pass_row.trap_pass_id,
    'wave_number', pass_row.wave_number,
    'wave_name', pass_row.wave_name,
    'serial_number', pass_row.serial_number,
    'display_name', pass_row.display_name,
    'discord_role', pass_row.discord_role,
    'status', pass_row.status,
    'missions_completed', pass_row.missions_completed,
    'unlock_level', pass_row.unlock_level,
    'thread_keys', to_jsonb(pass_row.thread_keys),
    'phase_level',
      case
        when pass_row.unlock_level >= 5 then 6
        when pass_row.unlock_level >= 4 then 5
        when pass_row.unlock_level >= 2 then 4
        when pass_row.missions_completed >= 1 then 3
        when coalesce(array_length(pass_row.thread_keys, 1), 0) > 0 then 2
        else 1
      end,
    'phase_name',
      case
        when pass_row.unlock_level >= 5 then 'Future Unlock Ready'
        when pass_row.unlock_level >= 4 then 'Back Rooms'
        when pass_row.unlock_level >= 2 then 'Archive Witness'
        when pass_row.missions_completed >= 1 then 'Mission Proof'
        when coalesce(array_length(pass_row.thread_keys, 1), 0) > 0 then 'Thread Witness'
        else 'Claim The Key'
      end,
    'created_at', pass_row.created_at
  );
$$;

create or replace function public.trap_house_clean_thread_keys(keys text[] default null)
returns text[]
language plpgsql
immutable
as $$
declare
  allowed text[] := array[
    'trap-pass-lore',
    'public-project-witness',
    'addiction-machine',
    'psychosis-loop',
    'grief-loss',
    'cats-home-tenderness',
    'writing-inside-the-fire',
    'money-desperation',
    'system-mirror',
    'platform-war',
    'self-destruction-vs-creation',
    'ending-convergence'
  ];
  cleaned text[] := '{}';
  item text;
begin
  if keys is null or array_length(keys, 1) is null then
    return array['trap-pass-lore', 'public-project-witness'];
  end if;

  foreach item in array keys loop
    item := lower(regexp_replace(public.trap_house_clean_text(item, 80), '[_[:space:]]+', '-', 'g'));
    if item = any(allowed) and not (item = any(cleaned)) then
      cleaned := cleaned || item;
    end if;
    exit when array_length(cleaned, 1) >= 5;
  end loop;

  if array_length(cleaned, 1) is null then
    return array['trap-pass-lore', 'public-project-witness'];
  end if;

  return cleaned;
end;
$$;

create or replace function public.capture_entry_email(
  p_email text,
  p_source text default 'entry_gate',
  p_page_path text default null,
  p_user_agent text default null,
  p_metadata jsonb default '{}'::jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  clean_email text := public.trap_house_normalize_email(p_email);
  clean_source text := coalesce(nullif(public.trap_house_clean_text(p_source, 80), ''), 'entry_gate');
  saved public.email_captures;
begin
  if not public.trap_house_is_email(clean_email) then
    raise exception 'valid_email_required' using errcode = '22023';
  end if;

  insert into public.email_captures (email, source, page_path, user_agent, metadata)
  values (
    clean_email,
    clean_source,
    public.trap_house_clean_text(p_page_path, 260),
    public.trap_house_clean_text(p_user_agent, 260),
    coalesce(p_metadata, '{}'::jsonb)
  )
  on conflict (email_normalized, source) do update
    set page_path = excluded.page_path,
        user_agent = excluded.user_agent,
        metadata = public.email_captures.metadata || excluded.metadata
  returning * into saved;

  return jsonb_build_object(
    'ok', true,
    'source', saved.source,
    'captured_at', saved.updated_at
  );
end;
$$;

create or replace function public.trap_house_next_serial(p_wave_number integer)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  next_serial integer;
begin
  insert into public.trap_pass_wave_counters (wave_number, current_serial)
  values (p_wave_number, 1)
  on conflict (wave_number) do update
    set current_serial = public.trap_pass_wave_counters.current_serial + 1,
        updated_at = now()
  returning current_serial into next_serial;

  return next_serial;
end;
$$;

create or replace function public.claim_trap_pass(
  p_email text,
  p_display_name text default null,
  p_discord_username text default null,
  p_wallet_address text default null,
  p_thread_keys text[] default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  clean_email text := public.trap_house_normalize_email(p_email);
  existing public.trap_passes;
  saved public.trap_passes;
  serial integer;
  wave integer := 3;
  clean_threads text[] := public.trap_house_clean_thread_keys(p_thread_keys);
begin
  if not public.trap_house_is_email(clean_email) then
    raise exception 'valid_email_required' using errcode = '22023';
  end if;

  select * into existing
  from public.trap_passes
  where email_normalized = clean_email
  limit 1;

  if found then
    update public.trap_passes
       set display_name = coalesce(nullif(public.trap_house_clean_text(p_display_name, 80), ''), existing.display_name),
           discord_username = coalesce(nullif(public.trap_house_clean_text(p_discord_username, 80), ''), existing.discord_username),
           wallet_address = coalesce(nullif(public.trap_house_clean_text(p_wallet_address, 120), ''), existing.wallet_address),
           thread_keys = clean_threads
     where id = existing.id
     returning * into saved;

    return jsonb_build_object(
      'ok', true,
      'existed', true,
      'pass', public.trap_house_public_pass(saved)
    );
  end if;

  serial := public.trap_house_next_serial(wave);

  insert into public.trap_passes (
    trap_pass_id,
    wave_number,
    wave_name,
    serial_number,
    email,
    display_name,
    discord_username,
    wallet_address,
    discord_role,
    status,
    missions_completed,
    unlock_level,
    thread_keys
  )
  values (
    'W' || wave || '-' || lpad(serial::text, 5, '0'),
    wave,
    'All Hands On Deck',
    serial,
    clean_email,
    coalesce(nullif(public.trap_house_clean_text(p_display_name, 80), ''), 'New Arrival'),
    nullif(public.trap_house_clean_text(p_discord_username, 80), ''),
    nullif(public.trap_house_clean_text(p_wallet_address, 120), ''),
    'All Hands On Deck',
    'active',
    0,
    1,
    clean_threads
  )
  returning * into saved;

  return jsonb_build_object(
    'ok', true,
    'existed', false,
    'pass', public.trap_house_public_pass(saved)
  );
end;
$$;

create or replace function public.lookup_trap_pass_public(p_query text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  clean_query text := public.trap_house_clean_text(p_query, 220);
  found_pass public.trap_passes;
begin
  if clean_query = '' then
    return jsonb_build_object('ok', true, 'found', false, 'pass', null);
  end if;

  if position('@' in clean_query) > 0 then
    select * into found_pass
    from public.trap_passes
    where email_normalized = public.trap_house_normalize_email(clean_query)
    limit 1;
  else
    select * into found_pass
    from public.trap_passes
    where trap_pass_id = public.trap_house_normalize_pass_id(clean_query)
    limit 1;
  end if;

  if not found then
    return jsonb_build_object('ok', true, 'found', false, 'pass', null);
  end if;

  return jsonb_build_object(
    'ok', true,
    'found', true,
    'pass', public.trap_house_public_pass(found_pass)
  );
end;
$$;

grant execute on function public.capture_entry_email(text, text, text, text, jsonb) to anon, authenticated;
grant execute on function public.claim_trap_pass(text, text, text, text, text[]) to anon, authenticated;
grant execute on function public.lookup_trap_pass_public(text) to anon, authenticated;

comment on table public.email_captures is 'Private entry-gate email captures for launch updates and recovery.';
comment on table public.trap_passes is 'Private Trap Pass storage. Public browser code should use RPC functions only.';
comment on function public.capture_entry_email(text, text, text, text, jsonb) is 'Public-safe email capture endpoint. Does not return private row IDs.';
comment on function public.claim_trap_pass(text, text, text, text, text[]) is 'Claims or updates a Trap Pass and returns only a shareable public pass summary.';
comment on function public.lookup_trap_pass_public(text) is 'Looks up a pass by ID or email and returns only shareable public fields.';
