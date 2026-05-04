-- NY33 Growth Board - reports + share_token
-- Run this in Supabase Dashboard -> SQL Editor

-- 1. add share_token / logo_url to clients
alter table public.clients
  add column if not exists share_token text,
  add column if not exists logo_url text;

-- backfill share_token for existing rows
update public.clients
set share_token = substring(replace(gen_random_uuid()::text, '-', ''), 1, 16)
where share_token is null;

alter table public.clients
  alter column share_token set not null,
  alter column share_token set default substring(replace(gen_random_uuid()::text, '-', ''), 1, 16);

create unique index if not exists clients_share_token_key on public.clients (share_token);

-- 2. reports table (one row per client per month)
create table public.reports (
  id                    uuid primary key default gen_random_uuid(),
  client_id             uuid not null references public.clients(id) on delete cascade,
  month                 date not null,
  highlight             text,
  achievements          text,
  implemented_summary   text,
  next_focus            text,
  kpi_snapshot          jsonb,
  improvements_snapshot jsonb,
  next_actions_snapshot jsonb,
  published             boolean not null default false,
  published_at          timestamptz,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  unique (client_id, month)
);

create index reports_client_published_idx
  on public.reports (client_id, published, month desc);

create trigger reports_set_updated_at
before update on public.reports
for each row execute function public.set_updated_at();

-- rls (MVP: anon can do everything; tighten before production)
alter table public.reports enable row level security;
create policy "mvp_anon_all" on public.reports
  for all to anon using (true) with check (true);
