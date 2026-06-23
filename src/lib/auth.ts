import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Plan } from "@/lib/plans";

export interface SessionContext {
  userId: string;
  email: string | undefined;
  tenantId: string;
  role: "owner" | "admin" | "staff";
  fullName: string | null;
  plan: Plan;
  companyName: string;
}

/** ログイン中ユーザーのテナント/ロール/プランを解決。未認証なら /login へ */
export async function requireSession(): Promise<SessionContext> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("tenant_id, role, full_name, tenants(company_name, plan)")
    .eq("id", user.id)
    .single();

  if (!profile) redirect("/signup");

  // tenants は単一リレーション
  const tenant = (profile as any).tenants;

  return {
    userId: user.id,
    email: user.email,
    tenantId: profile.tenant_id,
    role: profile.role as SessionContext["role"],
    fullName: profile.full_name,
    plan: (tenant?.plan ?? "free") as Plan,
    companyName: tenant?.company_name ?? "",
  };
}

export function isAdmin(role: string) {
  return role === "owner" || role === "admin";
}
