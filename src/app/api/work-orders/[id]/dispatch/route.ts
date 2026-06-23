import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireSession, isAdmin } from "@/lib/auth";
import { linePushText } from "@/lib/line";

export const runtime = "nodejs";

export async function POST(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const session = await requireSession();
  if (!isAdmin(session.role)) {
    return NextResponse.json(
      { error: { code: "forbidden", message: "権限がありません" } },
      { status: 403 }
    );
  }
  const supabase = createClient();

  const { data: wo } = await supabase
    .from("work_orders")
    .select(
      "id, instructions, scheduled_from, time_range, sites(name, prefecture, city, address_line), work_order_assignees(profiles(id, full_name, line_user_id))"
    )
    .eq("id", params.id)
    .maybeSingle();
  if (!wo) {
    return NextResponse.json(
      { error: { code: "not_found", message: "作業指示が見つかりません" } },
      { status: 404 }
    );
  }

  const site = (wo as any).sites;
  const text = [
    "【作業指示】",
    `現場: ${site?.name ?? ""}`,
    `住所: ${[site?.prefecture, site?.city, site?.address_line].filter(Boolean).join("")}`,
    `日時: ${wo.scheduled_from ?? "未定"} ${wo.time_range ?? ""}`,
    `内容: ${wo.instructions ?? ""}`,
    `${process.env.NEXT_PUBLIC_APP_URL}/work-orders/${wo.id}`,
  ].join("\n");

  let success = 0,
    failed = 0,
    skipped = 0;

  const assignees = (wo as any).work_order_assignees || [];
  for (const a of assignees) {
    const p = a.profiles;
    if (!p) continue;
    if (p.line_user_id) {
      const res = await linePushText(p.line_user_id, text);
      if (res.ok) success++;
      else failed++;
      await supabase.from("notification_logs").insert({
        tenant_id: session.tenantId,
        channel: "line",
        target: p.line_user_id,
        payload: text.slice(0, 500),
        result: res.ok ? "success" : `failed: ${res.error ?? res.status}`,
      });
    } else {
      // LINE 未連携: メールフォールバック (メール未保持ならスキップ)
      skipped++;
      await supabase.from("notification_logs").insert({
        tenant_id: session.tenantId,
        channel: "line",
        target: p.full_name ?? p.id,
        payload: text.slice(0, 500),
        result: "skipped: LINE未連携",
      });
    }
  }

  return NextResponse.json({ success, failed, skipped });
}
