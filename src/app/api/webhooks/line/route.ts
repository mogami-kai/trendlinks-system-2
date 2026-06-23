import { NextResponse } from "next/server";
import { verifyLineSignature } from "@/lib/line";

export const runtime = "nodejs";

/**
 * LINE Webhook。友だち追加 (follow) 等のイベントを受信。
 * 実運用では follow イベントで連携コードと userId を突き合わせ profiles.line_user_id を更新する。
 */
export async function POST(request: Request) {
  const body = await request.text();
  const sig = request.headers.get("x-line-signature");
  const valid = await verifyLineSignature(body, sig);
  if (!valid) {
    return NextResponse.json({ error: "invalid signature" }, { status: 401 });
  }

  // TODO: follow / message イベントを処理し line_user_id を紐付け
  return NextResponse.json({ ok: true });
}
