import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireSession } from "@/lib/auth";
import { PageHeader } from "@/components/PageHeader";

export default async function MyTasksPage() {
  const session = await requireSession();
  const supabase = createClient();

  const { data } = await supabase
    .from("work_order_assignees")
    .select(
      "work_orders(id, instructions, status, scheduled_from, scheduled_to, sites(name))"
    )
    .eq("profile_id", session.userId);

  const tasks = (data || [])
    .map((d: any) => d.work_orders)
    .filter(Boolean)
    .sort((a: any, b: any) =>
      (b.scheduled_from || "").localeCompare(a.scheduled_from || "")
    );

  return (
    <div>
      <PageHeader title="自分の作業" />
      {tasks.length > 0 ? (
        <ul className="space-y-2">
          {tasks.map((w: any) => (
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
        <p className="text-sm text-slate-500">割り当てられた作業はありません。</p>
      )}
    </div>
  );
}
