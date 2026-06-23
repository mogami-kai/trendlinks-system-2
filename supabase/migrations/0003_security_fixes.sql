-- ============================================================
-- 0003: セキュリティ/整合性の修正 (コードレビュー反映)
-- ============================================================

-- (5) is_admin を security definer 化 (RLS 再帰リスクの排除)
create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select public.current_role() in ('owner', 'admin')
$$;

-- (3) profiles 自己更新での権限昇格を防止
--   - 全更新はテナント内に限定
--   - 管理者はテナント内のロール変更可
--   - 本人はロール/テナントを変更できない (既存値と一致を強制)
drop policy if exists profiles_update_self on public.profiles;
drop policy if exists profiles_update on public.profiles;
create policy profiles_update on public.profiles for update
  using (
    tenant_id = public.current_tenant_id()
    and (id = auth.uid() or public.is_admin())
  )
  with check (
    tenant_id = public.current_tenant_id()
    and (
      public.is_admin()
      or (id = auth.uid() and role = public.current_role())
    )
  );

-- (2)(7) 担当スタッフが自分の作業指示を更新 (ステータス変更) できるようにする
--   汎用 _write ポリシー (admin のみ) に加え、assignee の update を許可
drop policy if exists wo_update_assignee on public.work_orders;
create policy wo_update_assignee on public.work_orders for update
  using (
    tenant_id = public.current_tenant_id()
    and (
      public.is_admin()
      or exists (
        select 1 from public.work_order_assignees a
        where a.work_order_id = id and a.profile_id = auth.uid()
      )
    )
  )
  with check (tenant_id = public.current_tenant_id());

-- (4) pdf_reports は report_id 単位で一意 (upsert onConflict 用)
do $$ begin
  alter table public.pdf_reports add constraint uq_pdf_reports_report unique (report_id);
exception when duplicate_table then null; when duplicate_object then null; end $$;
