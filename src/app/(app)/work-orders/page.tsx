import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireSession, isAdmin } from "@/lib/auth";
import { PageHeader } from "@/components/PageHeader";

export default async function WorkOrdersPage({
  searchParams,
}: {
  searchParams: { site?: string; from?: string; to?: string; status?: string };
}) {
  const session = await requireSession();
  const supabase = createClient();

  const [{ data: sites }] = await Promise.all([
    supabase.from("sites").select("id, name").order("name"),
  ]);

  let query = supabase
    .from("work_orders")
    .select("id, instructions, status, scheduled_from, scheduled_to, sites(name)")
    .order("scheduled_from", { ascending: false });

  if (searchParams.site) query = query.eq("site_id", searchParams.site);
  if (searchParams.status) query = query.eq("status", searchParams.status);
  if (searchParams.from) query = query.gte("scheduled_from", searchParams.from);
  if (searchParams.to) query = query.lte("scheduled_to", searchParams.to);

  const { data: orders } = await query;

  return (
    <div>
      <PageHeader
        title="作業指示"
        action={isAdmin(session.role) ? { href: "/work-orders/new", label: "+ 作業指示" } : undefined}
      />

      <form className="mb-4 grid gap-2 sm:grid-cols-4">
        <select name="site" defaultValue={searchParams.site} className="input">
          <option value="">全現場</option>
          {sites?.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
        <input type="date" name="from" defaultValue={searchParams.from} className="input" />
        <input type="date" name="to" defaultValue={searchParams.to} className="input" />
        <select name="status" defaultValue={searchParams.status} className="input">
          <option value="">全ステータス</option>
          <option value="todo">未着手</option>
          <option value="in_progress">対応中</option>
          <option value="done">完了</option>
          <option value="confirmed">確認済</option>
        </select>
        <button className="btn-secondary sm:col-span-4">絞り込む</button>
      </form>

      {orders && orders.length > 0 ? (
        <ul className="space-y-2">
          {orders.map((w: any) => (
            <li key={w.id}>
              <Link href={`/work-orders/${w.id}`} className="card block hover:bg-slate-50">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{w.sites?.name ?? "—"}</span>
                  <span className="badge bg-slate-100 text-slate-600">{w.status}</span>
                </div>
                <p className="mt-1 text-sm text-slate-500">
                  {w.scheduled_from || "日程未定"}
                  {w.scheduled_to ? ` 〜 ${w.scheduled_to}` : ""}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-slate-500">該当する作業指示がありません。</p>
      )}
    </div>
  );
}
