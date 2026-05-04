-- NY33 Growth Board - hearing submissions
-- Run this in Supabase Dashboard -> SQL Editor

create table public.hearing_submissions (
  id uuid primary key default gen_random_uuid(),

  -- A. 会社情報
  company_name   text not null,
  industry       text,
  contact_name   text,
  contact_email  text,
  contact_phone  text,
  contact_line   text,
  website_url    text,

  -- B. 商品とお客様
  main_product     text,
  price_range      text,
  target_customer  text,

  -- C. 集客導線の現状
  has_website              boolean,
  has_gbp                  boolean,
  gbp_review_count         integer,
  gbp_rating               numeric(2,1),
  has_line                 boolean,
  line_subscriber_count    integer,
  has_instagram            boolean,
  instagram_follower_count integer,
  booking_method           text,
  has_ads                  boolean,

  -- D. 数字
  monthly_visitors      integer,
  monthly_bookings      integer,
  monthly_revenue_range text,
  repeat_rate_percent   integer,

  -- E. 課題と目標
  biggest_issue   text,
  six_month_goal  text,
  past_attempts   text,

  -- meta
  status text not null default 'new'
    check (status in ('new','contacted','converted','archived')),
  converted_to_client_id uuid references public.clients(id) on delete set null,
  admin_note text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index hearing_submissions_status_idx
  on public.hearing_submissions (status, created_at desc);

create trigger hearing_submissions_set_updated_at
before update on public.hearing_submissions
for each row execute function public.set_updated_at();

-- rls (MVP: anon allowed; tighten before production)
alter table public.hearing_submissions enable row level security;
create policy "mvp_anon_all" on public.hearing_submissions
  for all to anon using (true) with check (true);
