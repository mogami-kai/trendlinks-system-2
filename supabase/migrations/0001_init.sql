-- ============================================================
-- Trendlinks 現場管理SaaS — 初期スキーマ (要件定義 04章準拠)
-- ============================================================

create extension if not exists "pgcrypto";

-- ── enums ───────────────────────────────────────────────
do $$ begin
  create type plan_type as enum ('free', 'starter', 'pro');
exception when duplicate_object then null; end $$;

do $$ begin
  create type user_role as enum ('owner', 'admin', 'staff');
exception when duplicate_object then null; end $$;

do $$ begin
  create type wo_status as enum ('todo', 'in_progress', 'done', 'confirmed');
exception when duplicate_object then null; end $$;

do $$ begin
  create type report_status as enum ('draft', 'submitted', 'approved', 'rejected');
exception when duplicate_object then null; end $$;

-- ── tenants ─────────────────────────────────────────────
create table if not exists public.tenants (
  id uuid primary key default gen_random_uuid(),
  company_name text not null,
  plan plan_type not null default 'free',
  status text not null default 'active',
  billing_email text,
  created_at timestamptz not null default now()
);

-- ── profiles (auth.users と 1:1) ────────────────────────
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  role user_role not null default 'staff',
  full_name text,
  phone text,
  line_user_id text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);
create index if not exists idx_profiles_tenant on public.profiles(tenant_id);

-- ── customers (取引先) ──────────────────────────────────
create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  name text not null,
  email text,
  contact text,
  created_at timestamptz not null default now()
);
create index if not exists idx_customers_tenant on public.customers(tenant_id);

-- ── sites (現場) ────────────────────────────────────────
create table if not exists public.sites (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  customer_id uuid references public.customers(id) on delete set null,
  name text not null,
  postal_code text,
  prefecture text,
  city text,
  address_line text,
  building text,
  lat numeric,
  lng numeric,
  contract jsonb not null default '{}'::jsonb,
  status text not null default 'active',
  created_at timestamptz not null default now()
);
create index if not exists idx_sites_tenant on public.sites(tenant_id);

-- ── work_orders (作業指示) ──────────────────────────────
create table if not exists public.work_orders (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  site_id uuid not null references public.sites(id) on delete cascade,
  scheduled_from date,
  scheduled_to date,
  time_range text,
  instructions text,
  checklist jsonb not null default '[]'::jsonb,
  priority int not null default 0,
  status wo_status not null default 'todo',
  created_at timestamptz not null default now()
);
create index if not exists idx_wo_tenant on public.work_orders(tenant_id);
create index if not exists idx_wo_site on public.work_orders(site_id);
create index if not exists idx_wo_sched on public.work_orders(scheduled_from, scheduled_to);

-- ── work_order_assignees (多対多) ───────────────────────
create table if not exists public.work_order_assignees (
  work_order_id uuid not null references public.work_orders(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  primary key (work_order_id, profile_id)
);

-- ── reports (現場報告) ──────────────────────────────────
create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  work_order_id uuid not null references public.work_orders(id) on delete cascade,
  reporter_id uuid references public.profiles(id) on delete set null,
  comment text,
  result jsonb not null default '{}'::jsonb,
  status report_status not null default 'draft',
  reported_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists idx_reports_tenant on public.reports(tenant_id);
create index if not exists idx_reports_wo on public.reports(work_order_id);

-- ── report_photos (最大5枚) ─────────────────────────────
create table if not exists public.report_photos (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references public.reports(id) on delete cascade,
  storage_path text not null,
  sort_order int not null default 0
);
create index if not exists idx_photos_report on public.report_photos(report_id);

-- 写真は1報告あたり最大5枚 (トリガーで担保)
create or replace function public.enforce_photo_limit()
returns trigger language plpgsql as $$
begin
  if (select count(*) from public.report_photos where report_id = new.report_id) >= 5 then
    raise exception '写真は1報告あたり最大5枚までです';
  end if;
  return new;
end $$;

drop trigger if exists trg_photo_limit on public.report_photos;
create trigger trg_photo_limit before insert on public.report_photos
  for each row execute function public.enforce_photo_limit();

-- ── arrivals (GPS到着) ──────────────────────────────────
create table if not exists public.arrivals (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  work_order_id uuid not null references public.work_orders(id) on delete cascade,
  staff_id uuid references public.profiles(id) on delete set null,
  lat numeric not null,
  lng numeric not null,
  distance_m numeric,
  is_arrived boolean not null default false,
  method text not null default 'auto',
  arrived_at timestamptz not null default now()
);
create index if not exists idx_arrivals_tenant on public.arrivals(tenant_id);

-- ── pdf_reports (生成PDF) ───────────────────────────────
create table if not exists public.pdf_reports (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  report_id uuid not null references public.reports(id) on delete cascade,
  storage_path text not null,
  generated_at timestamptz not null default now(),
  sent_at timestamptz
);
create index if not exists idx_pdf_tenant on public.pdf_reports(tenant_id);

-- ── subscriptions (Stripe連携) ──────────────────────────
create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null unique references public.tenants(id) on delete cascade,
  stripe_customer_id text,
  stripe_subscription_id text,
  plan plan_type not null default 'free',
  status text not null default 'active',
  current_period_end timestamptz,
  updated_at timestamptz not null default now()
);

-- ── notification_logs (配信ログ) ────────────────────────
create table if not exists public.notification_logs (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  channel text not null,
  target text,
  payload text,
  result text not null,
  created_at timestamptz not null default now()
);
create index if not exists idx_notif_tenant on public.notification_logs(tenant_id);
