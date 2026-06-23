"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireSession, isAdmin } from "@/lib/auth";
import { siteSchema } from "@/lib/validators";
import { canAddMore } from "@/lib/plans";

function parseSite(formData: FormData) {
  return siteSchema.parse({
    name: formData.get("name"),
    customer_id: (formData.get("customer_id") as string) || null,
    postal_code: formData.get("postal_code") || undefined,
    prefecture: formData.get("prefecture") || undefined,
    city: formData.get("city") || undefined,
    address_line: formData.get("address_line") || undefined,
    building: formData.get("building") || undefined,
    lat: formData.get("lat") || null,
    lng: formData.get("lng") || null,
    status: (formData.get("status") as string) || "active",
  });
}

export async function createSite(formData: FormData) {
  const session = await requireSession();
  if (!isAdmin(session.role)) throw new Error("権限がありません");
  const supabase = createClient();

  // プラン上限チェック (サーバー側強制)
  const { count } = await supabase
    .from("sites")
    .select("id", { count: "exact", head: true });
  if (!canAddMore(session.plan, "sites", count ?? 0)) {
    throw new Error("プランの現場上限に達しています。アップグレードしてください。");
  }

  const input = parseSite(formData);
  const { error } = await supabase
    .from("sites")
    .insert({ ...input, tenant_id: session.tenantId });
  if (error) throw new Error(error.message);

  revalidatePath("/sites");
  redirect("/sites");
}

export async function updateSite(id: string, formData: FormData) {
  const session = await requireSession();
  if (!isAdmin(session.role)) throw new Error("権限がありません");
  const supabase = createClient();
  const input = parseSite(formData);
  const { error } = await supabase.from("sites").update(input).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/sites");
  redirect(`/sites/${id}`);
}

export async function deleteSite(id: string) {
  const session = await requireSession();
  if (!isAdmin(session.role)) throw new Error("権限がありません");
  const supabase = createClient();
  const { error } = await supabase.from("sites").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/sites");
  redirect("/sites");
}
