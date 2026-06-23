import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireSession, isAdmin } from "@/lib/auth";
import { PageHeader } from "@/components/PageHeader";

export default async function NotificationLogsPage() {
  const session = await requireSession();
  if (!isAdmin(session.role)) redirect("/dashboard");
  const supabase = createClient();
  const { data: logs } = await supabase
    .from("notification_logs")
    .select("id, channel, target, result, created_at")
    .order("created_at", { ascending: false })
    .limit(100);

  return (
    <div>
      <PageHeader title="配信ログ" />
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left text-slate-500">
              <th className="p-2">日時</th>
              <th className="p-2">経路</th>
              <th className="p-2">宛先</th>
              <th className="p-2">結果</th>
            </tr>
          </thead>
          <tbody>
            {logs?.map((l) => (
              <tr key={l.id} className="border-b border-slate-100">
                <td className="p-2">{new Date(l.created_at).toLocaleString("ja-JP")}</td>
                <td className="p-2">{l.channel}</td>
                <td className="p-2">{l.target}</td>
                <td className="p-2">
                  <span
                    className={
                      l.result.startsWith("success")
                        ? "text-brand-600"
                        : l.result.startsWith("skipped")
                          ? "text-slate-500"
                          : "text-red-600"
                    }
                  >
                    {l.result}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {(!logs || logs.length === 0) && (
          <p className="mt-3 text-sm text-slate-500">配信ログはありません。</p>
        )}
      </div>
    </div>
  );
}
