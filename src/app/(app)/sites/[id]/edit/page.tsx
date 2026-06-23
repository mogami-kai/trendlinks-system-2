import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireSession, isAdmin } from "@/lib/auth";
import { SiteForm } from "../../SiteForm";
import { updateSite, deleteSite } from "../../actions";

export default async function EditSitePage({
  params,
}: {
  params: { id: string };
}) {
  const session = await requireSession();
  if (!isAdmin(session.role)) redirect(`/sites/${params.id}`);
  const supabase = createClient();
  const [{ data: site }, { data: customers }] = await Promise.all([
    supabase.from("sites").select("*").eq("id", params.id).maybeSingle(),
    supabase.from("customers").select("id, name").order("name"),
  ]);
  if (!site) notFound();

  const updateWithId = updateSite.bind(null, params.id);
  const deleteWithId = deleteSite.bind(null, params.id);

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="mb-5 text-xl font-bold">現場を編集</h1>
      <SiteForm
        action={updateWithId}
        customers={customers || []}
        defaults={site}
        submitLabel="更新する"
      />
      <form action={deleteWithId} className="mt-6">
        <button className="btn-danger w-full">この現場を削除</button>
      </form>
    </div>
  );
}
