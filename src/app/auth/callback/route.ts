import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * OAuth / メール確認 / 招待のコールバック。
 * コード交換後、プロフィール未作成ならテナント+Owner を作成する。
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") || "/dashboard";

  if (code) {
    const supabase = createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("id")
          .eq("id", user.id)
          .maybeSingle();
        const meta = user.user_metadata || {};
        // 招待ユーザー (tenant_id を持つ) は新規テナントを作らない
        if (!profile && !meta.tenant_id) {
          await supabase.rpc("create_tenant_and_owner", {
            company: meta.company_name || meta.full_name || "マイ会社",
            owner_name: meta.full_name || user.email || "",
          });
        }
      }
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth`);
}
