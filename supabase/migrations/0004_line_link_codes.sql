-- ============================================================
-- 0004: LINE 連携コード (友だち追加後のアカウント紐付け自動化)
-- ============================================================

create table if not exists public.line_link_codes (
  code text primary key,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '30 minutes')
);
create index if not exists idx_link_codes_profile on public.line_link_codes(profile_id);

alter table public.line_link_codes enable row level security;

-- 本人のみ作成・参照・削除可 (Webhook は service_role でバイパス)
drop policy if exists link_codes_self on public.line_link_codes;
create policy link_codes_self on public.line_link_codes for all
  using (profile_id = auth.uid())
  with check (profile_id = auth.uid() and tenant_id = public.current_tenant_id());
