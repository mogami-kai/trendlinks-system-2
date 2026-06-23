import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireSession, isAdmin } from "@/lib/auth";
import { hasFeature } from "@/lib/plans";
import { getPhotoUrls } from "../actions";
import { ReportActions } from "./ReportActions";
import { PdfActions } from "./PdfActions";

export default async function ReportDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await requireSession();
  const supabase = createClient();

  const { data: report } = await supabase
    .from("reports")
    .select(
      "*, reporter:profiles(full_name), work_orders(sites(name, customers(name, email))), report_photos(storage_path, sort_order)"
    )
    .eq("id", params.id)
    .maybeSingle();
  if (!report) notFound();

  const photos = (report.report_photos || []).sort(
    (a: any, b: any) => a.sort_order - b.sort_order
  );
  const urls = await getPhotoUrls(photos.map((p: any) => p.storage_path));
  const site = (report as any).work_orders?.sites;
  const customerEmail = site?.customers?.email as string | undefined;

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold">{site?.name ?? "報告"}</h1>
        <span className="badge bg-slate-100 text-slate-600">{report.status}</span>
      </div>

      <div className="card space-y-2 text-sm">
        <Row label="報告日時">
          {report.reported_at
            ? new Date(report.reported_at).toLocaleString("ja-JP")
            : "—"}
        </Row>
        <Row label="担当">{(report as any).reporter?.full_name || "—"}</Row>
        <Row label="コメント">
          <span className="whitespace-pre-wrap">{report.comment || "—"}</span>
        </Row>
      </div>

      {urls.length > 0 && (
        <div className="mt-5">
          <h2 className="mb-2 text-lg font-semibold">写真</h2>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {urls.map((u, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={i} src={u} alt={`photo-${i}`} className="h-32 w-full rounded object-cover" />
            ))}
          </div>
        </div>
      )}

      {isAdmin(session.role) && (
        <div className="mt-6 space-y-4">
          <div>
            <h2 className="mb-2 text-lg font-semibold">承認</h2>
            <ReportActions id={report.id} />
          </div>
          <div>
            <h2 className="mb-2 text-lg font-semibold">顧客報告書 PDF</h2>
            {hasFeature(session.plan, "pdfReport") ? (
              <PdfActions reportId={report.id} customerEmail={customerEmail} />
            ) : (
              <p className="rounded bg-amber-50 p-2 text-xs text-amber-700">
                顧客報告書PDFは Pro プランの機能です。
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex">
      <span className="w-24 shrink-0 text-slate-500">{label}</span>
      <span className="flex-1">{children}</span>
    </div>
  );
}
