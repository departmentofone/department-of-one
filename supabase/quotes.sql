-- Private quote pages: departmentofone.net/pay/<token>. Run once in the Supabase SQL editor (FitLog
-- project, the same database as site_content and contact_messages). Needs is_site_owner() from
-- FitLog's migration_v25. Safe to run more than once.
--
-- Only the site owner can read or change the table (admin.html). Visitors never query it: the pay
-- page calls get_quote(token), which returns the one quote whose secret token matches and nothing
-- else, so quotes can't be listed or guessed (the token is 144 random bits).

create extension if not exists pgcrypto with schema extensions;

create table if not exists public.quotes (
  id uuid primary key default gen_random_uuid(),
  quote_no integer generated always as identity,
  token text not null unique default translate(encode(extensions.gen_random_bytes(18), 'base64'), '+/', '-_'),
  client_name text not null check (char_length(client_name) between 1 and 120),
  client_email text check (client_email is null or char_length(client_email) <= 320),
  title text not null check (char_length(title) between 1 and 160),
  scope text check (scope is null or char_length(scope) <= 4000),
  items jsonb not null default '[]'::jsonb check (jsonb_typeof(items) = 'array'),
  currency text not null default 'USD' check (currency ~ '^[A-Z]{3}$'),
  valid_until date,
  pay_url text check (pay_url is null or pay_url ~ '^https://'),
  pay_note text check (pay_note is null or char_length(pay_note) <= 200),
  status text not null default 'open' check (status in ('open', 'paid', 'void')),
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.quotes enable row level security;

drop policy if exists "only the site owner can read quotes" on public.quotes;
create policy "only the site owner can read quotes" on public.quotes
  for select using (public.is_site_owner());

drop policy if exists "only the site owner can add quotes" on public.quotes;
create policy "only the site owner can add quotes" on public.quotes
  for insert with check (public.is_site_owner());

drop policy if exists "only the site owner can change quotes" on public.quotes;
create policy "only the site owner can change quotes" on public.quotes
  for update using (public.is_site_owner()) with check (public.is_site_owner());

drop policy if exists "only the site owner can delete quotes" on public.quotes;
create policy "only the site owner can delete quotes" on public.quotes
  for delete using (public.is_site_owner());

-- What the pay page may see for one token. Void quotes behave like a link that doesn't exist.
create or replace function public.get_quote(p_token text)
returns table (
  quote_no integer,
  client_name text,
  title text,
  scope text,
  items jsonb,
  currency text,
  valid_until date,
  pay_url text,
  pay_note text,
  status text,
  paid_at timestamptz,
  created_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select q.quote_no, q.client_name, q.title, q.scope, q.items, q.currency, q.valid_until,
         q.pay_url, q.pay_note, q.status, q.paid_at, q.created_at
  from public.quotes q
  where char_length(p_token) >= 20
    and q.token = p_token
    and q.status <> 'void'
$$;

revoke all on function public.get_quote(text) from public;
grant execute on function public.get_quote(text) to anon, authenticated;
