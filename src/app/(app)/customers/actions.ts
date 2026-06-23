"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireSession, isAdmin } from "@/lib/auth";
import { customerSchema } from "@/lib/validators";

export async function createCustomer(formData: FormData) {
  const session = await requireSession();
  if (!isAdmin(session.role)) throw new Error("権限がありません");
  const input = customerSchema.parse({
    name: formData.get("name"),
    email: formData.get("email") || "",
    contact: formData.get("contact") || undefined,
  });
  const supabase = createClient();
  const { error } = await supabase.from("customers").insert({
    name: input.name,
    email: input.email || null,
    contact: input.contact,
    tenant_id: session.tenantId,
  });
  if (error) throw new Error(error.message);
  revalidatePath("/customers");
}

export async function deleteCustomer(id: string) {
  const session = await requireSession();
  if (!isAdmin(session.role)) throw new Error("権限がありません");
  const supabase = createClient();
  const { error } = await supabase.from("customers").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/customers");
}
