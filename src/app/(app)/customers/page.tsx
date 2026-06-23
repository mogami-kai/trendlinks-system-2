import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireSession, isAdmin } from "@/lib/auth";
import { PageHeader } from "@/components/PageHeader";
import { createCustomer, deleteCustomer } from "./actions";

export default async function CustomersPage() {
  const session = await requireSession();
  if (!isAdmin(session.role)) redirect("/dashboard");
  const supabase = createClient();
  const { data: customers } = await supabase
    .from("customers")
    .select("id, name, email, contact")
    .order("name");

  return (
    <div>
      <PageHeader title="取引先" />

      <form action={createCustomer} className="card mb-5 grid gap-3 sm:grid-cols-4">
        <input name="name" placeholder="取引先名 *" className="input" required />
        <input name="email" type="email" placeholder="メール (PDF送付先)" className="input" />
        <input name="contact" placeholder="担当者・連絡先" className="input" />
        <button className="btn-primary">追加</button>
      </form>

      <ul className="space-y-2">
        {customers?.map((c) => (
          <li key={c.id} className="card flex items-center justify-between">
            <div>
              <div className="font-medium">{c.name}</div>
              <div className="text-sm text-slate-500">
                {[c.email, c.contact].filter(Boolean).join(" / ") || "—"}
              </div>
            </div>
            <form action={deleteCustomer.bind(null, c.id)}>
              <button className="text-sm text-red-600 hover:underline">削除</button>
            </form>
          </li>
        ))}
        {(!customers || customers.length === 0) && (
          <p className="text-sm text-slate-500">取引先が登録されていません。</p>
        )}
      </ul>
    </div>
  );
}
