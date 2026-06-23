"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireSession, isAdmin } from "@/lib/auth";
import { workOrderSchema } from "@/lib/validators";
import { dispatchWorkOrder } from "@/lib/dispatch";

function parseWO(formData: FormData) {
  return workOrderSchema.parse({
    site_id: formData.get("site_id"),
    scheduled_from: (formData.get("scheduled_from") as string) || null,
    scheduled_to: (formData.get("scheduled_to") as string) || null,
    time_range: formData.get("time_range") || undefined,
    instructions: formData.get("instructions") || undefined,
    priority: formData.get("priority") || 0,
    assignee_ids: formData.getAll("assignee_ids") as string[],
  });
}

async function syncAssignees(
  woId: string,
  assigneeIds: string[]
) {
  const supabase = createClient();
  await supabase.from("work_order_assignees").delete().eq("work_order_id", woId);
  if (assigneeIds.length > 0) {
    await supabase.from("work_order_assignees").insert(
      assigneeIds.map((pid) => ({ work_order_id: woId, profile_id: pid }))
    );
  }
}

export async function createWorkOrder(formData: FormData) {
  const session = await requireSession();
  if (!isAdmin(session.role)) throw new Error("権限がありません");
  const supabase = createClient();
  const input = parseWO(formData);
  const { assignee_ids, ...wo } = input;

  const { data, error } = await supabase
    .from("work_orders")
    .insert({ ...wo, tenant_id: session.tenantId })
    .select("id")
    .single();
  if (error) throw new Error(error.message);
  await syncAssignees(data.id, assignee_ids);

  // 作成と同時に LINE 配信する場合 (認証済みクライアントで直接実行)
  if (formData.get("dispatch") === "on") {
    await dispatchWorkOrder(supabase, session.tenantId, data.id).catch(() => {});
  }

  revalidatePath("/work-orders");
  redirect(`/work-orders/${data.id}`);
}

export async function updateWorkOrder(id: string, formData: FormData) {
  const session = await requireSession();
  if (!isAdmin(session.role)) throw new Error("権限がありません");
  const supabase = createClient();
  const input = parseWO(formData);
  const { assignee_ids, ...wo } = input;
  const { error } = await supabase.from("work_orders").update(wo).eq("id", id);
  if (error) throw new Error(error.message);
  await syncAssignees(id, assignee_ids);
  revalidatePath("/work-orders");
  redirect(`/work-orders/${id}`);
}

export async function deleteWorkOrder(id: string) {
  const session = await requireSession();
  if (!isAdmin(session.role)) throw new Error("権限がありません");
  const supabase = createClient();
  const { error } = await supabase.from("work_orders").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/work-orders");
  redirect("/work-orders");
}

export async function updateWorkOrderStatus(id: string, status: string) {
  await requireSession();
  const supabase = createClient();
  const { error } = await supabase
    .from("work_orders")
    .update({ status })
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath(`/work-orders/${id}`);
}
