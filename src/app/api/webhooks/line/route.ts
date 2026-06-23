import { NextResponse } from "next/server";
import { verifyLineSignature } from "@/lib/line";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

/**
 * LINE Webhook。
 * - follow: 連携案内 (送信は任意)
 * - message(text): 連携コードと一致すれば profiles.line_user_id を紐付け
 */
export async function POST(request: Request) {
  const body = await request.text();
  const sig = request.headers.get("x-line-signature");
  const valid = await verifyLineSignature(body, sig);
  if (!valid) {
    return NextResponse.json({ error: "invalid signature" }, { status: 401 });
  }

  let payload: any;
  try {
    payload = JSON.parse(body);
  } catch {
    return NextResponse.json({ ok: true });
  }

  const admin = createAdminClient();
  const events = payload.events || [];

  for (const ev of events) {
    if (ev.type === "message" && ev.message?.type === "text") {
      const code = String(ev.message.text || "").trim().toUpperCase();
      const userId = ev.source?.userId;
      if (!code || !userId) continue;

      const { data: link } = await admin
        .from("line_link_codes")
        .select("code, profile_id, expires_at")
        .eq("code", code)
        .maybeSingle();

      if (link && new Date(link.expires_at) > new Date()) {
        await admin
          .from("profiles")
          .update({ line_user_id: userId })
          .eq("id", link.profile_id);
        await admin.from("line_link_codes").delete().eq("code", code);
      }
    }
  }

  return NextResponse.json({ ok: true });
}
