import Link from "next/link";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PLANS } from "@/lib/plans";

export default async function DashboardPage() {
  const session = await requireSession();
  const supabase = createClient();

  const today = new Date().toISOString().slice(0, 10);

  const [{ count: siteCount }, { count: staffCount }, { data: todayWO }] =
    await Promise.all([
      supabase.from("sites").select("id", { count: "exact", head: true }),
      supabase.from("profiles").select("id", { count: "exact", head: true }),
      supabase
        .from("work_orders")
        .select("id, instructions, status, sites(name)")
        .lte("scheduled_from", today)
        .gte("scheduled_to", today)
        .limit(10),
    ]);

  const plan = PLANS[session.plan];

  return (
    <div>
      <h1 className="text-xl font-bold">ダッシュボード</h1>
      <p className="mt-1 text-sm text-slate-500">
        {session.companyName} / {plan.label} プラン
      </p>

      <div className="mt-5 grid gap-4 sm:grid-cols-3">
        <div className="card">
          <div className="text-sm text-slate-500">現場数</div>
          <div className="mt-1 text-2xl font-bold">
            {siteCount ?? 0}
            <span className="text-sm font-normal text-slate-400">
              {" "}
              / {plan.maxSites < 0 ? "∞" : plan.maxSites}
            </span>
          </div>
        </div>
        <div className="card">
          <div className="text-sm text-slate-500">スタッフ数</div>
          <div className="mt-1 text-2xl font-bold">
            {staffCount ?? 0}
            <span className="text-sm font-normal text-slate-400">
              {" "}
              / {plan.maxStaff < 0 ? "∞" : plan.maxStaff}
            </span>
          </div>
        </div>
        <div className="card">
          <div className="text-sm text-slate-500">本日の作業指示</div>
          <div className="mt-1 text-2xl font-bold">{todayWO?.length ?? 0}</div>
        </div>
      </div>

      <h2 className="mb-3 mt-8 text-lg font-semibold">本日の作業指示</h2>
      {todayWO && todayWO.length > 0 ? (
        <ul className="space-y-2">
          {todayWO.map((w: any) => (
            <li key={w.id}>
              <Link href={`/work-orders/${w.id}`} className="card block hover:bg-slate-50">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{w.sites?.name ?? "—"}</span>
                  <span className="badge bg-slate-100 text-slate-600">{w.status}</span>
                </div>
                <p className="mt-1 truncate text-sm text-slate-500">
                  {w.instructions || "（指示なし）"}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-slate-500">本日の作業指示はありません。</p>
      )}
    </div>
  );
}
