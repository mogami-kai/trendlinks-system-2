import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireSession, isAdmin } from "@/lib/auth";

export default async function SiteDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await requireSession();
  const supabase = createClient();
  const { data: site } = await supabase
    .from("sites")
    .select("*, customers(name, email)")
    .eq("id", params.id)
    .maybeSingle();
  if (!site) notFound();

  const { data: workOrders } = await supabase
    .from("work_orders")
    .select("id, instructions, status, scheduled_from")
    .eq("site_id", params.id)
    .order("scheduled_from", { ascending: false })
    .limit(20);

  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <h1 className="text-xl font-bold">{site.name}</h1>
        {isAdmin(session.role) && (
          <Link href={`/sites/${site.id}/edit`} className="btn-secondary">
            編集
          </Link>
        )}
      </div>

      <div className="card space-y-2 text-sm">
        <Row label="住所">
          {[site.postal_code, site.prefecture, site.city, site.address_line, site.building]
            .filter(Boolean)
            .join(" ") || "—"}
        </Row>
        <Row label="緯度経度">
          {site.lat != null && site.lng != null ? `${site.lat}, ${site.lng}` : "未設定"}
        </Row>
        <Row label="取引先">{site.customers?.name || "—"}</Row>
        <Row label="ステータス">{site.status}</Row>
      </div>

      <div className="mt-6 flex items-center justify-between">
        <h2 className="text-lg font-semibold">作業指示</h2>
        {isAdmin(session.role) && (
          <Link href={`/work-orders/new?site=${site.id}`} className="btn-primary">
            + 作業指示
          </Link>
        )}
      </div>
      <ul className="mt-3 space-y-2">
        {workOrders?.map((w) => (
          <li key={w.id}>
            <Link href={`/work-orders/${w.id}`} className="card block hover:bg-slate-50">
              <div className="flex justify-between">
                <span className="text-sm">{w.scheduled_from || "日程未定"}</span>
                <span className="badge bg-slate-100 text-slate-600">{w.status}</span>
              </div>
              <p className="mt-1 truncate text-sm text-slate-500">{w.instructions}</p>
            </Link>
          </li>
        ))}
        {(!workOrders || workOrders.length === 0) && (
          <p className="text-sm text-slate-500">作業指示はありません。</p>
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
