import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireSession, isAdmin } from "@/lib/auth";
import { hasFeature } from "@/lib/plans";
import { DispatchButton } from "./DispatchButton";
import { StatusControl } from "./StatusControl";

export default async function WorkOrderDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await requireSession();
  const supabase = createClient();

  const { data: wo } = await supabase
    .from("work_orders")
    .select(
      "*, sites(id, name, lat, lng), work_order_assignees(profiles(id, full_name))"
    )
    .eq("id", params.id)
    .maybeSingle();
  if (!wo) notFound();

  const { data: reports } = await supabase
    .from("reports")
    .select("id, status, reported_at")
    .eq("work_order_id", params.id)
    .order("created_at", { ascending: false });

  const { data: arrivals } = await supabase
    .from("arrivals")
    .select("distance_m, is_arrived, arrived_at")
    .eq("work_order_id", params.id)
    .order("arrived_at", { ascending: false })
    .limit(5);

  const assignees =
    wo.work_order_assignees?.map((a: any) => a.profiles?.full_name).filter(Boolean) ||
    [];
  const assigneeIds: string[] =
    wo.work_order_assignees?.map((a: any) => a.profiles?.id).filter(Boolean) || [];
  const canUpdateStatus =
    isAdmin(session.role) || assigneeIds.includes(session.userId);

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold">{wo.sites?.name ?? "作業指示"}</h1>
        <div className="flex items-center gap-2">
          {canUpdateStatus && (
            <StatusControl workOrderId={wo.id} current={wo.status} />
          )}
          {isAdmin(session.role) && (
            <Link href={`/work-orders/${wo.id}/edit`} className="btn-secondary">
              編集
            </Link>
          )}
        </div>
      </div>

      <div className="card space-y-2 text-sm">
        <Row label="日程">
          {wo.scheduled_from || "未定"}
          {wo.scheduled_to ? ` 〜 ${wo.scheduled_to}` : ""} {wo.time_range || ""}
        </Row>
        <Row label="担当">{assignees.join(", ") || "—"}</Row>
        <Row label="優先度">{wo.priority}</Row>
        <Row label="作業内容">
          <span className="whitespace-pre-wrap">{wo.instructions || "—"}</span>
        </Row>
      </div>

      <div className="mt-5 flex flex-wrap gap-3">
        <Link href={`/work-orders/${wo.id}/arrive`} className="btn-primary">
          GPS到着確認
        </Link>
        <Link href={`/work-orders/${wo.id}/report`} className="btn-primary">
          現場報告を作成
        </Link>
        {isAdmin(session.role) && <DispatchButton workOrderId={wo.id} />}
      </div>

      {!hasFeature(session.plan, "gpsArrival") && (
        <p className="mt-3 rounded bg-amber-50 p-2 text-xs text-amber-700">
          GPS到着確認は Pro プランの機能です。
        </p>
      )}

      <h2 className="mb-2 mt-8 text-lg font-semibold">到着履歴</h2>
      {arrivals && arrivals.length > 0 ? (
        <ul className="space-y-1 text-sm">
          {arrivals.map((a, i) => (
            <li key={i} className="card flex justify-between py-2">
              <span>{new Date(a.arrived_at).toLocaleString("ja-JP")}</span>
              <span>
                {a.is_arrived ? "✅ 到着" : "❌ 圏外"}（
                {a.distance_m != null ? `${Math.round(a.distance_m)}m` : "—"}）
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-slate-500">到着記録はありません。</p>
      )}

      <h2 className="mb-2 mt-8 text-lg font-semibold">報告</h2>
      <ul className="space-y-2">
        {reports?.map((r) => (
          <li key={r.id}>
            <Link href={`/reports/${r.id}`} className="card block hover:bg-slate-50">
              <div className="flex justify-between text-sm">
                <span>{r.reported_at ? new Date(r.reported_at).toLocaleString("ja-JP") : "下書き"}</span>
                <span className="badge bg-slate-100 text-slate-600">{r.status}</span>
              </div>
            </Link>
          </li>
        ))}
        {(!reports || reports.length === 0) && (
          <p className="text-sm text-slate-500">報告はまだありません。</p>
        )}
      </ul>
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
