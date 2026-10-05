-- Review and run in the existing project's SQL editor. No new database required.
begin;
create table if not exists public.archive_items (
 id text primary key check(id ~ '^[a-zA-Z0-9][a-zA-Z0-9-]{2,79}$'),
 status text not null default 'draft' check(status in ('draft','published')),
 payload jsonb not null,
 version integer not null default 1,
 added_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 published_at timestamptz,
 owner_id uuid not null references auth.users(id)
);
create table if not exists public.archive_revisions (
 revision_id bigint generated always as identity primary key,
 item_id text not null references public.archive_items(id),
 version integer not null,
 payload jsonb not null,
 saved_at timestamptz not null default now(),
 owner_id uuid not null references auth.users(id)
);
alter table public.archive_items enable row level security;
alter table public.archive_revisions enable row level security;
revoke all on public.archive_items,public.archive_revisions from anon,authenticated;
grant select,insert,update on public.archive_items to service_role;
grant select,insert on public.archive_revisions to service_role;
grant usage,select on sequence public.archive_revisions_revision_id_seq to service_role;
-- No direct browser database policies. Owner checks are mandatory in /api/archive.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values ('archive-originals','archive-originals',false,26214400,
 array['image/jpeg','image/png','image/webp','image/gif','application/pdf','text/plain','application/vnd.openxmlformats-officedocument.wordprocessingml.document'])
on conflict(id) do update set public=false,file_size_limit=26214400,allowed_mime_types=excluded.allowed_mime_types;
-- This restrictive policy also protects against a broad permissive policy elsewhere.
drop policy if exists archive_private_bucket on storage.objects;
create policy archive_private_bucket on storage.objects as restrictive for all to anon,authenticated
using(bucket_id <> 'archive-originals') with check(bucket_id <> 'archive-originals');
create or replace function public.archive_save(p_id text,p_payload jsonb,p_expected_version integer,p_owner uuid)
returns setof public.archive_items language plpgsql security invoker set search_path=public as $$
declare old public.archive_items; next_status text; original jsonb; reflection jsonb;
begin
 next_status=p_payload->>'status';
 select * into old from archive_items where id=p_id for update;
 if found then
  if old.version<>p_expected_version or old.owner_id<>p_owner then raise exception 'Record changed or owner mismatch'; end if;
  -- Removing an image never deletes or replaces the original. Preserve every stored file.
  for original in select * from jsonb_array_elements(coalesce(old.payload->'media','[]')) loop
   if not exists(select 1 from jsonb_array_elements(coalesce(p_payload->'media','[]')) m where m->>'storagePath'=original->>'storagePath') then raise exception 'Original files must be preserved'; end if;
  end loop;
  for reflection in select * from jsonb_array_elements(coalesce(old.payload->'reflections','[]')) loop
   if not coalesce(p_payload->'reflections','[]') @> jsonb_build_array(reflection) then raise exception 'Dated reflections must be preserved'; end if;
  end loop;
  insert into archive_revisions(item_id,version,payload,owner_id) values(old.id,old.version,old.payload,p_owner);
  update archive_items set payload=p_payload,status=next_status,version=old.version+1,updated_at=now(),published_at=case when next_status='published' then coalesce(old.published_at,now()) else old.published_at end where id=p_id;
 else
  if p_expected_version<>0 then raise exception 'Record not found'; end if;
  insert into archive_items(id,status,payload,owner_id,published_at) values(p_id,next_status,p_payload,p_owner,case when next_status='published' then now() else null end);
 end if;
 return query select * from archive_items where id=p_id;
end $$;
revoke all on function public.archive_save(text,jsonb,integer,uuid) from public,anon,authenticated;
grant execute on function public.archive_save(text,jsonb,integer,uuid) to service_role;
commit;
