import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireSession, isAdmin } from "@/lib/auth";
import { hasFeature } from "@/lib/plans";
import { sendEmail } from "@/lib/brevo";

export const runtime = "nodejs";

const PDF_BUCKET = "pdf-reports";

export async function POST(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireSession();
    if (!isAdmin(session.role) || !hasFeature(session.plan, "pdfReport")) {
      return NextResponse.json(
        { error: { code: "forbidden", message: "権限がありません" } },
        { status: 403 }
      );
    }

    const supabase = createClient();
    const { data: report } = await supabase
      .from("reports")
      .select("id, work_orders(sites(name, customers(name, email)))")
      .eq("id", params.id)
      .maybeSingle();
    if (!report) {
      return NextResponse.json(
        { error: { code: "not_found", message: "報告が見つかりません" } },
        { status: 404 }
      );
    }

    const site = (report as any).work_orders?.sites;
    const to = site?.customers?.email as string | undefined;
    if (!to) {
      return NextResponse.json(
        { error: { code: "no_email", message: "取引先メールが未設定です" } },
        { status: 400 }
      );
    }

    const admin = createAdminClient();
    const { data: pdfRow } = await admin
      .from("pdf_reports")
      .select("storage_path")
      .eq("report_id", report.id)
      .maybeSingle();
    if (!pdfRow) {
      return NextResponse.json(
        { error: { code: "no_pdf", message: "先にPDFを生成してください" } },
        { status: 400 }
      );
    }

    const { data: file } = await admin.storage
      .from(PDF_BUCKET)
      .download(pdfRow.storage_path);
    const base64 = file
      ? Buffer.from(await file.arrayBuffer()).toString("base64")
      : "";

    const result = await sendEmail({
      to,
      subject: `【清掃完了報告書】${site?.name ?? ""}`,
      html: `<p>${session.companyName} より、清掃完了報告書をお送りします。添付PDFをご確認ください。</p>`,
      attachments: [{ name: "report.pdf", contentBase64: base64 }],
    });
    if (!result.ok) throw new Error(result.error || "送信に失敗しました");

    await admin
      .from("pdf_reports")
      .update({ sent_at: new Date().toISOString() })
      .eq("report_id", report.id);
    await admin.from("notification_logs").insert({
      tenant_id: session.tenantId,
      channel: "email",
      target: to,
      payload: "顧客報告書PDF送付",
      result: "success",
    });

    return NextResponse.json({ ok: true, to });
  } catch (e) {
    return NextResponse.json(
      { error: { code: "error", message: (e as Error).message } },
      { status: 500 }
    );
  }
}
