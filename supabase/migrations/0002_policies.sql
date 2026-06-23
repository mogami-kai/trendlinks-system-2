-- ============================================================
-- RLS ポリシー (要件定義 04.3 / 07.4 準拠)
-- テナント分離: JWT の claim から tenant_id を解決する
-- ============================================================

-- 現在ユーザーの tenant_id / role を返すヘルパ (profiles 参照)
create or replace function public.current_tenant_id()
returns uuid language sql stable security definer set search_path = public as $$
  select tenant_id from public.profiles where id = auth.uid()
$$;

create or replace function public.current_role()
returns user_role language sql stable security definer set search_path = public as $$
  select role from public.profiles where id = auth.uid()
$$;

create or replace function public.is_admin()
returns boolean language sql stable as $$
  select public.current_role() in ('owner', 'admin')
$$;

-- RLS 有効化
alter table public.tenants               enable row level security;
alter table public.profiles              enable row level security;
alter table public.customers             enable row level security;
alter table public.sites                 enable row level security;
alter table public.work_orders           enable row level security;
alter table public.work_order_assignees  enable row level security;
alter table public.reports               enable row level security;
alter table public.report_photos         enable row level security;
alter table public.arrivals              enable row level security;
alter table public.pdf_reports           enable row level security;
alter table public.subscriptions         enable row level security;
alter table public.notification_logs     enable row level security;

-- tenants: 自テナントのみ参照、Owner のみ更新
drop policy if exists tenants_select on public.tenants;
create policy tenants_select on public.tenants for select
  using (id = public.current_tenant_id());
drop policy if exists tenants_update on public.tenants;
create policy tenants_update on public.tenants for update
  using (id = public.current_tenant_id() and public.current_role() = 'owner');

-- profiles: 自テナント参照、Admin が管理 / 本人更新
drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles for select
  using (tenant_id = public.current_tenant_id());
drop policy if exists profiles_update_self on public.profiles;
create policy profiles_update_self on public.profiles for update
  using (id = auth.uid() or public.is_admin());
drop policy if exists profiles_admin_write on public.profiles;
create policy profiles_admin_write on public.profiles for insert
  with check (tenant_id = public.current_tenant_id() and public.is_admin());

-- 汎用: テナント一致で全操作可 (Admin)、参照は全ロール
-- customers / sites / work_orders / customers などに適用
do $$
declare t text;
begin
  foreach t in array array['customers','sites','work_orders','pdf_reports','notification_logs'] loop
    execute format('drop policy if exists %1$s_select on public.%1$s;', t);
    execute format('create policy %1$s_select on public.%1$s for select using (tenant_id = public.current_tenant_id());', t);
    execute format('drop policy if exists %1$s_write on public.%1$s;', t);
    execute format('create policy %1$s_write on public.%1$s for all using (tenant_id = public.current_tenant_id() and public.is_admin()) with check (tenant_id = public.current_tenant_id() and public.is_admin());', t);
  end loop;
end $$;

-- work_order_assignees: テナント (親WO経由) で参照、Admin が編集
drop policy if exists woa_select on public.work_order_assignees;
create policy woa_select on public.work_order_assignees for select
  using (exists (select 1 from public.work_orders w
    where w.id = work_order_id and w.tenant_id = public.current_tenant_id()));
drop policy if exists woa_write on public.work_order_assignees;
create policy woa_write on public.work_order_assignees for all
  using (public.is_admin() and exists (select 1 from public.work_orders w
    where w.id = work_order_id and w.tenant_id = public.current_tenant_id()))
  with check (exists (select 1 from public.work_orders w
    where w.id = work_order_id and w.tenant_id = public.current_tenant_id()));

-- reports: テナント参照、スタッフは自分の報告を作成/更新、Admin は全操作
drop policy if exists reports_select on public.reports;
create policy reports_select on public.reports for select
  using (tenant_id = public.current_tenant_id());
drop policy if exists reports_insert on public.reports;
create policy reports_insert on public.reports for insert
  with check (tenant_id = public.current_tenant_id());
drop policy if exists reports_update on public.reports;
create policy reports_update on public.reports for update
  using (tenant_id = public.current_tenant_id()
    and (public.is_admin() or reporter_id = auth.uid()));
drop policy if exists reports_delete on public.reports;
create policy reports_delete on public.reports for delete
  using (tenant_id = public.current_tenant_id() and public.is_admin());

-- report_photos: 親 report のテナントで判定
drop policy if exists photos_select on public.report_photos;
create policy photos_select on public.report_photos for select
  using (exists (select 1 from public.reports r
    where r.id = report_id and r.tenant_id = public.current_tenant_id()));
drop policy if exists photos_write on public.report_photos;
create policy photos_write on public.report_photos for all
  using (exists (select 1 from public.reports r
    where r.id = report_id and r.tenant_id = public.current_tenant_id()))
  with check (exists (select 1 from public.reports r
    where r.id = report_id and r.tenant_id = public.current_tenant_id()));

-- arrivals: テナント参照、本人が作成
drop policy if exists arrivals_select on public.arrivals;
create policy arrivals_select on public.arrivals for select
  using (tenant_id = public.current_tenant_id());
drop policy if exists arrivals_insert on public.arrivals;
create policy arrivals_insert on public.arrivals for insert
  with check (tenant_id = public.current_tenant_id());

-- subscriptions: 自テナント参照のみ (更新は service_role / Webhook)
drop policy if exists subs_select on public.subscriptions;
create policy subs_select on public.subscriptions for select
  using (tenant_id = public.current_tenant_id());

-- ============================================================
-- サインアップ補助: 新規ユーザー作成時にテナント+プロフィールを作成
-- (アプリ側 Server Action でも実装するが、RPC として用意)
-- ============================================================
create or replace function public.create_tenant_and_owner(company text, owner_name text)
returns uuid language plpgsql security definer set search_path = public as $$
declare new_tenant uuid;
begin
  insert into public.tenants (company_name) values (company) returning id into new_tenant;
  insert into public.profiles (id, tenant_id, role, full_name)
    values (auth.uid(), new_tenant, 'owner', owner_name);
  insert into public.subscriptions (tenant_id, plan, status) values (new_tenant, 'free', 'active');
  return new_tenant;
end $$;
