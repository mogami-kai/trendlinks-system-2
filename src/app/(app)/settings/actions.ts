"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireSession } from "@/lib/auth";

export async function updateProfile(formData: FormData) {
  const session = await requireSession();
  const supabase = createClient();
  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: (formData.get("full_name") as string) || null,
      phone: (formData.get("phone") as string) || null,
      line_user_id: (formData.get("line_user_id") as string) || null,
    })
    .eq("id", session.userId);
  if (error) throw new Error(error.message);
  revalidatePath("/settings");
}

export async function updateCompany(formData: FormData) {
  const session = await requireSession();
  if (session.role !== "owner") throw new Error("オーナーのみ変更できます");
  const supabase = createClient();
  const { error } = await supabase
    .from("tenants")
    .update({
      company_name: (formData.get("company_name") as string) || session.companyName,
      billing_email: (formData.get("billing_email") as string) || null,
    })
    .eq("id", session.tenantId);
  if (error) throw new Error(error.message);
  revalidatePath("/settings");
}
