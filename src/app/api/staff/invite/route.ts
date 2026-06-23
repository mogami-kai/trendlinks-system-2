import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { requireSession, isAdmin } from "@/lib/auth";
import { canAddMore } from "@/lib/plans";

export const runtime = "nodejs";

/** スタッフ招待。Supabase Admin API でメール招待し、テナントに紐付ける */
export async function POST(request: Request) {
  try {
    const session = await requireSession();
    if (!isAdmin(session.role)) {
      return NextResponse.json(
        { error: { code: "forbidden", message: "権限がありません" } },
        { status: 403 }
      );
    }
    const { email, role } = (await request.json()) as {
      email: string;
      role: "admin" | "staff";
    };

    const supabase = createClient();
    const { count } = await supabase
      .from("profiles")
      .select("id", { count: "exact", head: true });
    if (!canAddMore(session.plan, "staff", count ?? 0)) {
      return NextResponse.json(
        { error: { code: "limit", message: "プランのスタッフ上限に達しています" } },
        { status: 400 }
      );
    }

    const admin = createAdminClient();
    const { data, error } = await admin.auth.admin.inviteUserByEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
      data: { tenant_id: session.tenantId, role },
    });
    if (error) throw new Error(error.message);

    // 招待ユーザーのプロフィールを作成 (テナント紐付け)
    if (data.user) {
      await admin.from("profiles").upsert({
        id: data.user.id,
        tenant_id: session.tenantId,
        role: role ?? "staff",
      });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { error: { code: "error", message: (e as Error).message } },
      { status: 500 }
    );
  }
}
