import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireSession, isAdmin } from "@/lib/auth";
import { PageHeader } from "@/components/PageHeader";
import { PLANS } from "@/lib/plans";
import { InviteForm } from "./InviteForm";

export default async function StaffPage() {
  const session = await requireSession();
  if (!isAdmin(session.role)) redirect("/dashboard");
  const supabase = createClient();
  const { data: staff, count } = await supabase
    .from("profiles")
    .select("id, full_name, role, is_active, line_user_id", { count: "exact" })
    .order("created_at");

  const max = PLANS[session.plan].maxStaff;

  return (
    <div>
      <PageHeader title="スタッフ" />
      <p className="mb-4 text-sm text-slate-500">
        {count ?? 0} / {max < 0 ? "無制限" : `${max}名`}
      </p>

      <InviteForm />

      <ul className="space-y-2">
        {staff?.map((s) => (
          <li key={s.id} className="card flex items-center justify-between">
            <div>
              <div className="font-medium">{s.full_name || "（未設定）"}</div>
              <div className="text-sm text-slate-500">
                {s.role}
                {s.line_user_id ? " ・ LINE連携済" : " ・ LINE未連携"}
              </div>
            </div>
            <span className="badge bg-slate-100 text-slate-600">
              {s.is_active ? "有効" : "無効"}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
