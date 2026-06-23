"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireSession, isAdmin } from "@/lib/auth";

export async function setStaffRole(profileId: string, role: "admin" | "staff") {
  const session = await requireSession();
  if (!isAdmin(session.role)) throw new Error("権限がありません");
  if (profileId === session.userId) throw new Error("自分のロールは変更できません");
  const supabase = createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ role })
    .eq("id", profileId);
  if (error) throw new Error(error.message);
  revalidatePath("/staff");
}

export async function setStaffActive(profileId: string, active: boolean) {
  const session = await requireSession();
  if (!isAdmin(session.role)) throw new Error("権限がありません");
  if (profileId === session.userId) throw new Error("自分は無効化できません");
  const supabase = createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ is_active: active })
    .eq("id", profileId);
  if (error) throw new Error(error.message);
  revalidatePath("/staff");
}
