/** LINE Messaging API ラッパ (FR-3 作業指示配信) */

interface LinePushResult {
  ok: boolean;
  status: number;
  error?: string;
}

/** 指定ユーザーへ Push メッセージ送信 */
export async function linePushText(
  to: string,
  text: string
): Promise<LinePushResult> {
  const token = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  if (!token) return { ok: false, status: 0, error: "LINE token 未設定" };

  try {
    const res = await fetch("https://api.line.me/v2/bot/message/push", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        to,
        messages: [{ type: "text", text }],
      }),
    });
    if (!res.ok) {
      return { ok: false, status: res.status, error: await res.text() };
    }
    return { ok: true, status: res.status };
  } catch (e) {
    return { ok: false, status: 0, error: (e as Error).message };
  }
}

/** LINE Webhook 署名検証 (x-line-signature) */
export async function verifyLineSignature(
  body: string,
  signature: string | null
): Promise<boolean> {
  const secret = process.env.LINE_CHANNEL_SECRET;
  if (!secret || !signature) return false;
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(body));
  const digest = Buffer.from(new Uint8Array(sig)).toString("base64");
  return digest === signature;
}
