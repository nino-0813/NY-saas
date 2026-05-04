-- NY33 Growth Board - initial schema
-- Run this in Supabase Dashboard -> SQL Editor

-- updated_at trigger helper
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- clients
create table public.clients (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  industry      text,
  status        text not null default 'active',
  current_issue text,
  monthly_goal  text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create trigger clients_set_updated_at
before update on public.clients
for each row execute function public.set_updated_at();

-- kpis: one row per client per month
create table public.kpis (
  id                 uuid primary key default gen_random_uuid(),
  client_id          uuid not null references public.clients(id) on delete cascade,
  month              date not null,
  site_visits        integer,
  line_signups       integer,
  inquiries          integer,
  expected_revenue   integer,
  improvements_count integer,
  estimated_impact   text,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  unique (client_id, month)
);

create index kpis_client_month_idx on public.kpis (client_id, month desc);

create trigger kpis_set_updated_at
before update on public.kpis
for each row execute function public.set_updated_at();

-- improvements: improvement log entries
create table public.improvements (
  id          uuid primary key default gen_random_uuid(),
  client_id   uuid not null references public.clients(id) on delete cascade,
  title       text not null,
  description text,
  purpose     text,
  result      text,
  done_at     date not null default current_date,
  created_at  timestamptz not null default now()
);

create index improvements_client_done_idx on public.improvements (client_id, done_at desc);

-- next_actions: what we will do next
create table public.next_actions (
  id              uuid primary key default gen_random_uuid(),
  client_id       uuid not null references public.clients(id) on delete cascade,
  title           text not null,
  expected_effect text,
  priority        text not null default 'medium' check (priority in ('high','medium','low')),
  status          text not null default 'todo'   check (status in ('todo','doing','done')),
  due_date        date,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index next_actions_client_status_idx on public.next_actions (client_id, status, priority);

create trigger next_actions_set_updated_at
before update on public.next_actions
for each row execute function public.set_updated_at();

-- ----------------------------------------------------------------------
-- RLS: temporarily allow anon full access for MVP (no auth yet).
-- TIGHTEN BEFORE PRODUCTION: replace with auth.uid()-based policies.
-- ----------------------------------------------------------------------
alter table public.clients       enable row level security;
alter table public.kpis          enable row level security;
alter table public.improvements  enable row level security;
alter table public.next_actions  enable row level security;

create policy "mvp_anon_all" on public.clients      for all to anon using (true) with check (true);
create policy "mvp_anon_all" on public.kpis         for all to anon using (true) with check (true);
create policy "mvp_anon_all" on public.improvements for all to anon using (true) with check (true);
create policy "mvp_anon_all" on public.next_actions for all to anon using (true) with check (true);
