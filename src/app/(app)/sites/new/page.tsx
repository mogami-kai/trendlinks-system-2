import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireSession, isAdmin } from "@/lib/auth";
import { SiteForm } from "../SiteForm";
import { createSite } from "../actions";

export default async function NewSitePage() {
  const session = await requireSession();
  if (!isAdmin(session.role)) redirect("/sites");
  const supabase = createClient();
  const { data: customers } = await supabase
    .from("customers")
    .select("id, name")
    .order("name");

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="mb-5 text-xl font-bold">現場を追加</h1>
      <SiteForm action={createSite} customers={customers || []} submitLabel="登録する" />
    </div>
  );
}
