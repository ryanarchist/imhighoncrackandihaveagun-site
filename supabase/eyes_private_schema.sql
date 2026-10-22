-- Additive migration in the EXISTING Supabase project. No commerce or archive changes.
-- Keep EYES_SUBMISSIONS_ENABLED unset until installation and authenticated review testing pass.
begin;
create table if not exists public.eyes_submissions (
 id uuid primary key,
 token_hash text not null,
 payload jsonb not null,
 state text not null default 'uploading' check(state in ('uploading','submitted')),
 review_status text not null default 'pending' check(review_status in ('pending','reviewed','declined')),
 created_at timestamptz not null default now(),
 submitted_at timestamptz
);
create table if not exists public.eyes_rate_limits (client_hash text primary key,window_start timestamptz not null default now(),requests integer not null default 0);
alter table public.eyes_submissions enable row level security;
alter table public.eyes_rate_limits enable row level security;
revoke all on public.eyes_submissions,public.eyes_rate_limits from public,anon,authenticated;
grant select,insert,update,delete on public.eyes_submissions,public.eyes_rate_limits to service_role;
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values ('eyes-private','eyes-private',false,8388608,array['text/plain','application/pdf','image/jpeg','image/png','image/webp','audio/mpeg','audio/wav','audio/ogg','audio/webm','audio/mp4']) on conflict(id) do update set public=false,file_size_limit=8388608,allowed_mime_types=excluded.allowed_mime_types;
drop policy if exists eyes_private_only on storage.objects;
create policy eyes_private_only on storage.objects as restrictive for all to anon,authenticated using(bucket_id<>'eyes-private') with check(bucket_id<>'eyes-private');
create or replace function public.eyes_begin(p_id uuid,p_token_hash text,p_payload jsonb,p_client text) returns void language plpgsql security invoker set search_path=public as $$
declare limit_row public.eyes_rate_limits;
begin
 insert into eyes_rate_limits(client_hash) values(p_client) on conflict do nothing;
 select * into limit_row from eyes_rate_limits where client_hash=p_client for update;
 if limit_row.window_start<now()-interval '1 hour' then update eyes_rate_limits set requests=0,window_start=now() where client_hash=p_client;limit_row.requests:=0;end if;
 if limit_row.requests>=5 then raise exception 'RATE_LIMIT';end if;
 update eyes_rate_limits set requests=requests+1 where client_hash=p_client;
 insert into eyes_submissions(id,token_hash,payload) values(p_id,p_token_hash,p_payload);
end $$;
create or replace function public.eyes_finish(p_id uuid,p_token_hash text,p_files jsonb) returns void language plpgsql security invoker set search_path=public as $$
declare entry public.eyes_submissions;
begin
 select * into entry from eyes_submissions where id=p_id and token_hash=p_token_hash for update;
 if not found then raise exception 'NOT_FOUND';end if;
 if entry.state='submitted' then return;end if;
 update eyes_submissions set payload=jsonb_set(payload,'{files}',p_files),state='submitted',submitted_at=now() where id=p_id;
end $$;
revoke all on function public.eyes_begin(uuid,text,jsonb,text),public.eyes_finish(uuid,text,jsonb) from public,anon,authenticated;
grant execute on function public.eyes_begin(uuid,text,jsonb,text),public.eyes_finish(uuid,text,jsonb) to service_role;
commit;
-- Operational maintenance: review stale uploading rows/objects older than 24 hours;
-- remove only verified abandoned uploads, and expire rate-limit hashes after 48 hours.
-- No public collection API or publication policy is installed by this migration.
