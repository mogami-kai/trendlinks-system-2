import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireSession } from "@/lib/auth";
import { PageHeader } from "@/components/PageHeader";

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: { status?: string };
}) {
  await requireSession();
  const supabase = createClient();

  let query = supabase
    .from("reports")
    .select("id, status, reported_at, comment, work_orders(sites(name))")
    .order("created_at", { ascending: false });
  if (searchParams.status) query = query.eq("status", searchParams.status);

  const { data: reports } = await query;

  return (
    <div>
      <PageHeader title="報告" />
      <form className="mb-4">
        <select name="status" defaultValue={searchParams.status} className="input max-w-xs">
          <option value="">全ステータス</option>
          <option value="submitted">提出済</option>
          <option value="approved">承認済</option>
          <option value="rejected">差戻し</option>
        </select>
      </form>
      {reports && reports.length > 0 ? (
        <ul className="space-y-2">
          {reports.map((r: any) => (
            <li key={r.id}>
              <Link href={`/reports/${r.id}`} className="card block hover:bg-slate-50">
                <div className="flex items-center justify-between">
                  <span className="font-medium">
                    {r.work_orders?.sites?.name ?? "—"}
                  </span>
                  <span className="badge bg-slate-100 text-slate-600">{r.status}</span>
                </div>
                <p className="mt-1 truncate text-sm text-slate-500">
                  {r.reported_at ? new Date(r.reported_at).toLocaleString("ja-JP") : ""}{" "}
                  {r.comment || ""}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-slate-500">報告がありません。</p>
      )}
    </div>
  );
}
