import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireSession, isAdmin } from "@/lib/auth";
import { PageHeader } from "@/components/PageHeader";

export default async function SitesPage({
  searchParams,
}: {
  searchParams: { q?: string };
}) {
  const session = await requireSession();
  const supabase = createClient();

  let query = supabase
    .from("sites")
    .select("id, name, city, address_line, status, customers(name)")
    .order("created_at", { ascending: false });
  if (searchParams.q) query = query.ilike("name", `%${searchParams.q}%`);

  const { data: sites } = await query;

  return (
    <div>
      <PageHeader
        title="現場"
        action={isAdmin(session.role) ? { href: "/sites/new", label: "+ 現場を追加" } : undefined}
      />
      <form className="mb-4">
        <input
          name="q"
          defaultValue={searchParams.q}
          placeholder="現場名で検索"
          className="input max-w-xs"
        />
      </form>
      {sites && sites.length > 0 ? (
        <ul className="space-y-2">
          {sites.map((s: any) => (
            <li key={s.id}>
              <Link href={`/sites/${s.id}`} className="card block hover:bg-slate-50">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{s.name}</span>
                  <span className="badge bg-slate-100 text-slate-600">{s.status}</span>
                </div>
                <p className="mt-1 text-sm text-slate-500">
                  {[s.city, s.address_line].filter(Boolean).join(" ")}
                  {s.customers?.name ? ` ・ ${s.customers.name}` : ""}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-slate-500">現場がまだ登録されていません。</p>
      )}
    </div>
  );
}
