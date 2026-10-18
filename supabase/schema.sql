-- curriculi curricula: public CVs.
-- Run once in the Supabase SQL editor (Project → SQL Editor → New query → paste → Run).
--
-- Model: no accounts. When someone makes a CV public, their browser creates a random id and a secret owner
-- token. Only the SHA-256 of the token is stored. Anyone can read a public CV (that is the point of
-- "public"); only the holder of the token can update or delete it, and only through the functions below.
-- Making a CV private deletes the row, so its link stops working everywhere at once.

create extension if not exists pgcrypto with schema extensions;

create table if not exists public.public_cvs (
  id text primary key check (id ~ '^[a-z0-9]{10}$'),
  token_hash text not null,
  cv jsonb not null check (pg_column_size(cv) <= 300000),
  name text not null default '' check (char_length(name) <= 200),
  headline text not null default '' check (char_length(headline) <= 300),
  listed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.cv_reports (
  id bigint generated always as identity primary key,
  cv_id text not null,
  reason text not null default '' check (char_length(reason) <= 500),
  created_at timestamptz not null default now()
);

alter table public.public_cvs enable row level security;
alter table public.cv_reports enable row level security;

-- Reading: everyone, but never the token hash.
drop policy if exists "public CVs are readable" on public.public_cvs;
create policy "public CVs are readable" on public.public_cvs for select using (true);
revoke all on public.public_cvs from anon, authenticated;
grant select (id, cv, name, headline, listed, created_at, updated_at) on public.public_cvs to anon, authenticated;

-- Reports: nobody reads or writes them directly; the owner of the project sees them in the dashboard.
revoke all on public.cv_reports from anon, authenticated;

-- Publish or update. The first call claims the id with this token; later calls must bring the same token.
create or replace function public.publish_cv(p_id text, p_token text, p_cv jsonb, p_name text, p_headline text, p_listed boolean)
returns void
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  h text;
begin
  if p_token is null or char_length(p_token) < 32 then
    raise exception 'invalid token';
  end if;
  h := encode(digest(p_token, 'sha256'), 'hex');
  insert into public_cvs (id, token_hash, cv, name, headline, listed)
  values (p_id, h, p_cv, coalesce(left(p_name, 200), ''), coalesce(left(p_headline, 300), ''), coalesce(p_listed, false))
  on conflict (id) do update
    set cv = excluded.cv, name = excluded.name, headline = excluded.headline, listed = excluded.listed, updated_at = now()
    where public_cvs.token_hash = h;
  if not found then
    raise exception 'not allowed';
  end if;
end;
$$;

-- Make private again: delete the public copy.
create or replace function public.unpublish_cv(p_id text, p_token text)
returns void
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  delete from public_cvs where id = p_id and token_hash = encode(digest(coalesce(p_token, ''), 'sha256'), 'hex');
  if not found then
    -- Already gone is fine; a wrong token is not.
    if exists (select 1 from public_cvs where id = p_id) then
      raise exception 'not allowed';
    end if;
  end if;
end;
$$;

-- Report a listed CV (spam, someone else's data…). At most 20 reports per CV per hour.
create or replace function public.report_cv(p_id text, p_reason text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (select 1 from public_cvs where id = p_id) then
    return;
  end if;
  if (select count(*) from cv_reports where cv_id = p_id and created_at > now() - interval '1 hour') >= 20 then
    return;
  end if;
  insert into cv_reports (cv_id, reason) values (p_id, coalesce(left(p_reason, 500), ''));
end;
$$;

revoke all on function public.publish_cv(text, text, jsonb, text, text, boolean) from public;
revoke all on function public.unpublish_cv(text, text) from public;
revoke all on function public.report_cv(text, text) from public;
grant execute on function public.publish_cv(text, text, jsonb, text, text, boolean) to anon, authenticated;
grant execute on function public.unpublish_cv(text, text) to anon, authenticated;
grant execute on function public.report_cv(text, text) to anon, authenticated;
