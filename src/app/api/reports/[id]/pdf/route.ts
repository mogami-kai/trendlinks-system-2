import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireSession, isAdmin } from "@/lib/auth";
import { hasFeature } from "@/lib/plans";
import { generateReportPdf } from "@/lib/pdf";

export const runtime = "nodejs";

const PHOTO_BUCKET = "report-photos";
const PDF_BUCKET = "pdf-reports";

export async function POST(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireSession();
    if (!isAdmin(session.role) || !hasFeature(session.plan, "pdfReport")) {
      return NextResponse.json(
        { error: { code: "forbidden", message: "PDF生成は Pro プラン管理者の機能です" } },
        { status: 403 }
      );
    }

    const supabase = createClient();
    const { data: report } = await supabase
      .from("reports")
      .select(
        "id, comment, reported_at, reporter:profiles(full_name), work_orders(scheduled_from, sites(name, prefecture, city, address_line)), report_photos(storage_path, sort_order)"
      )
      .eq("id", params.id)
      .maybeSingle();
    if (!report) {
      return NextResponse.json(
        { error: { code: "not_found", message: "報告が見つかりません" } },
        { status: 404 }
      );
    }

    const admin = createAdminClient();
    const photos = ((report as any).report_photos || []).sort(
      (a: any, b: any) => a.sort_order - b.sort_order
    );
    const photoUrls: string[] = [];
    for (const p of photos) {
      const { data } = await admin.storage
        .from(PHOTO_BUCKET)
        .createSignedUrl(p.storage_path, 3600);
      if (data?.signedUrl) photoUrls.push(data.signedUrl);
    }

    const site = (report as any).work_orders?.sites;
    const buffer = await generateReportPdf({
      companyName: session.companyName,
      siteName: site?.name ?? "",
      siteAddress: [site?.prefecture, site?.city, site?.address_line]
        .filter(Boolean)
        .join(""),
      workDate: (report as any).work_orders?.scheduled_from ?? "",
      staffName: (report as any).reporter?.full_name ?? "",
      comment: report.comment ?? "",
      photoUrls,
      generatedAt: new Date().toLocaleDateString("ja-JP"),
    });

    const path = `${session.tenantId}/${report.id}.pdf`;
    await admin.storage
      .from(PDF_BUCKET)
      .upload(path, buffer, { contentType: "application/pdf", upsert: true });

    await admin.from("pdf_reports").upsert(
      {
        tenant_id: session.tenantId,
        report_id: report.id,
        storage_path: path,
        generated_at: new Date().toISOString(),
      },
      { onConflict: "report_id" as any }
    );

    const { data: signed } = await admin.storage
      .from(PDF_BUCKET)
      .createSignedUrl(path, 3600);

    return NextResponse.json({ url: signed?.signedUrl, path });
  } catch (e) {
    return NextResponse.json(
      { error: { code: "error", message: (e as Error).message } },
      { status: 500 }
    );
  }
}
