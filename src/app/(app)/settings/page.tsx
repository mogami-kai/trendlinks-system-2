import { createClient } from "@/lib/supabase/server";
import { requireSession } from "@/lib/auth";
import { PageHeader } from "@/components/PageHeader";
import { updateProfile, updateCompany } from "./actions";
import { LineLink } from "./LineLink";

export default async function SettingsPage() {
  const session = await requireSession();
  const supabase = createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, phone, line_user_id")
    .eq("id", session.userId)
    .maybeSingle();
  const { data: tenant } = await supabase
    .from("tenants")
    .select("company_name, billing_email")
    .eq("id", session.tenantId)
    .maybeSingle();

  return (
    <div className="max-w-lg">
      <PageHeader title="設定" />

      <h2 className="mb-2 text-lg font-semibold">プロフィール</h2>
      <form action={updateProfile} className="card space-y-3">
        <div>
          <label className="label">氏名</label>
          <input name="full_name" className="input" defaultValue={profile?.full_name ?? ""} />
        </div>
        <div>
          <label className="label">電話番号</label>
          <input name="phone" className="input" defaultValue={profile?.phone ?? ""} />
        </div>
        <div>
          <label className="label">LINE ユーザーID (作業指示配信用)</label>
          <input name="line_user_id" className="input" defaultValue={profile?.line_user_id ?? ""} />
        </div>
        <button className="btn-primary">保存</button>
      </form>

      <h2 className="mb-2 mt-8 text-lg font-semibold">LINE 連携</h2>
      <LineLink linked={!!profile?.line_user_id} />

      {session.role === "owner" && (
        <>
          <h2 className="mb-2 mt-8 text-lg font-semibold">会社情報</h2>
          <form action={updateCompany} className="card space-y-3">
            <div>
              <label className="label">会社名</label>
              <input name="company_name" className="input" defaultValue={tenant?.company_name ?? ""} />
            </div>
            <div>
              <label className="label">請求先メール</label>
              <input name="billing_email" type="email" className="input" defaultValue={tenant?.billing_email ?? ""} />
            </div>
            <button className="btn-primary">保存</button>
          </form>
        </>
      )}

      {session.role !== "staff" && (
        <>
          <h2 className="mb-2 mt-8 text-lg font-semibold">データ管理</h2>
          <div className="card space-y-2 text-sm">
            <div>
              <a href="/settings/notifications" className="text-brand-600 hover:underline">
                配信ログを見る
              </a>
            </div>
            <div className="text-slate-600">CSV エクスポート:</div>
            <div className="flex flex-wrap gap-3">
              <a href="/api/export/sites" className="text-brand-600 hover:underline">現場</a>
              <a href="/api/export/work-orders" className="text-brand-600 hover:underline">作業指示</a>
              <a href="/api/export/reports" className="text-brand-600 hover:underline">報告</a>
              <a href="/api/export/customers" className="text-brand-600 hover:underline">取引先</a>
            </div>
          </div>
        </>
      )}

      <h2 className="mb-2 mt-8 text-lg font-semibold">セキュリティ</h2>
      <div className="card text-sm text-slate-600">
        パスワード変更・2要素認証 (TOTP) の設定は{" "}
        <a href="/settings/security" className="text-brand-600 hover:underline">
          セキュリティ設定
        </a>
        {" "}から行えます。
      </div>
    </div>
  );
}
