"use server";

import { createClient } from "@/lib/supabase/server";
import { requireSession } from "@/lib/auth";

function randomCode(len = 6) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // 紛らわしい文字を除外
  let s = "";
  for (let i = 0; i < len; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}

/** LINE 連携用のワンタイムコードを発行する */
export async function createLineLinkCode(): Promise<string> {
  const session = await requireSession();
  const supabase = createClient();

  // 既存の未使用コードを削除してから新規発行
  await supabase.from("line_link_codes").delete().eq("profile_id", session.userId);

  const code = randomCode();
  const { error } = await supabase.from("line_link_codes").insert({
    code,
    profile_id: session.userId,
    tenant_id: session.tenantId,
  });
  if (error) throw new Error(error.message);
  return code;
}
