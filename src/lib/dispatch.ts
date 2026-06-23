import type { SupabaseClient } from "@supabase/supabase-js";
import { linePushText } from "@/lib/line";

export interface DispatchResult {
  success: number;
  failed: number;
  skipped: number;
}

/**
 * 作業指示を担当スタッフへ LINE 配信する共通処理。
 * Server Action / Route Handler の双方から、認証済みクライアントを渡して呼ぶ。
 */
export async function dispatchWorkOrder(
  supabase: SupabaseClient,
  tenantId: string,
  workOrderId: string
): Promise<DispatchResult> {
  const { data: wo } = await supabase
    .from("work_orders")
    .select(
      "id, instructions, scheduled_from, time_range, sites(name, prefecture, city, address_line), work_order_assignees(profiles(id, full_name, line_user_id))"
    )
    .eq("id", workOrderId)
    .maybeSingle();

  const result: DispatchResult = { success: 0, failed: 0, skipped: 0 };
  if (!wo) return result;

  const site = (wo as any).sites;
  const text = [
    "【作業指示】",
    `現場: ${site?.name ?? ""}`,
    `住所: ${[site?.prefecture, site?.city, site?.address_line].filter(Boolean).join("")}`,
    `日時: ${wo.scheduled_from ?? "未定"} ${wo.time_range ?? ""}`,
    `内容: ${wo.instructions ?? ""}`,
    `${process.env.NEXT_PUBLIC_APP_URL}/work-orders/${wo.id}`,
  ].join("\n");

  const assignees = (wo as any).work_order_assignees || [];
  for (const a of assignees) {
    const p = a.profiles;
    if (!p) continue;
    if (p.line_user_id) {
      const res = await linePushText(p.line_user_id, text);
      if (res.ok) result.success++;
      else result.failed++;
      await supabase.from("notification_logs").insert({
        tenant_id: tenantId,
        channel: "line",
        target: p.line_user_id,
        payload: text.slice(0, 500),
        result: res.ok ? "success" : `failed: ${res.error ?? res.status}`,
      });
    } else {
      result.skipped++;
      await supabase.from("notification_logs").insert({
        tenant_id: tenantId,
        channel: "line",
        target: p.full_name ?? p.id,
        payload: text.slice(0, 500),
        result: "skipped: LINE未連携",
      });
    }
  }

  return result;
}
