"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireSession, isAdmin } from "@/lib/auth";

const PHOTO_BUCKET = "report-photos";

export async function createReportWithPhotos(formData: FormData) {
  const session = await requireSession();
  const supabase = createClient();

  const workOrderId = formData.get("work_order_id") as string;
  const comment = (formData.get("comment") as string) || null;
  if (!workOrderId) throw new Error("作業指示が指定されていません");

  // 作業指示が自テナントのものか確認 (RLS でも担保)
  const { data: wo } = await supabase
    .from("work_orders")
    .select("id")
    .eq("id", workOrderId)
    .maybeSingle();
  if (!wo) throw new Error("作業指示が見つかりません");

  const { data: report, error } = await supabase
    .from("reports")
    .insert({
      tenant_id: session.tenantId,
      work_order_id: workOrderId,
      reporter_id: session.userId,
      comment,
      status: "submitted",
      reported_at: new Date().toISOString(),
    })
    .select("id")
    .single();
  if (error) throw new Error(error.message);

  // 写真アップロード (最大5枚)。サーバー側で admin クライアントを使用
  const files = formData.getAll("photos").filter((f): f is File => f instanceof File && f.size > 0);
  const admin = createAdminClient();
  let order = 0;
  for (const file of files.slice(0, 5)) {
    const path = `${session.tenantId}/${report.id}/${order}-${file.name}`;
    const buf = Buffer.from(await file.arrayBuffer());
    const { error: upErr } = await admin.storage
      .from(PHOTO_BUCKET)
      .upload(path, buf, { contentType: file.type, upsert: true });
    if (!upErr) {
      await admin.from("report_photos").insert({
        report_id: report.id,
        storage_path: path,
        sort_order: order,
      });
      order++;
    }
  }

  revalidatePath(`/work-orders/${workOrderId}`);
  redirect(`/reports/${report.id}`);
}

export async function setReportStatus(id: string, status: "approved" | "rejected") {
  const session = await requireSession();
  if (!isAdmin(session.role)) throw new Error("権限がありません");
  const supabase = createClient();
  const { error } = await supabase.from("reports").update({ status }).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath(`/reports/${id}`);
}

/** 署名URLを取得 (写真表示用) */
export async function getPhotoUrls(paths: string[]): Promise<string[]> {
  await requireSession();
  const admin = createAdminClient();
  const urls: string[] = [];
  for (const p of paths) {
    const { data } = await admin.storage
      .from(PHOTO_BUCKET)
      .createSignedUrl(p, 3600);
    if (data?.signedUrl) urls.push(data.signedUrl);
  }
  return urls;
}
