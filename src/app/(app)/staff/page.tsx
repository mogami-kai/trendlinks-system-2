import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireSession, isAdmin } from "@/lib/auth";
import { PageHeader } from "@/components/PageHeader";
import { PLANS } from "@/lib/plans";
import { InviteForm } from "./InviteForm";
import { StaffControls } from "./StaffControls";

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
          <li key={s.id} className="card flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="font-medium">{s.full_name || "（未設定）"}</div>
              <div className="text-sm text-slate-500">
                {s.role}
                {s.line_user_id ? " ・ LINE連携済" : " ・ LINE未連携"}
              </div>
            </div>
            {s.id === session.userId ? (
              <span className="badge bg-brand-100 text-brand-700">自分</span>
            ) : (
              <StaffControls
                id={s.id}
                role={s.role as "owner" | "admin" | "staff"}
                active={s.is_active}
              />
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
