import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireSession, isAdmin } from "@/lib/auth";
import { WorkOrderForm } from "../WorkOrderForm";
import { createWorkOrder } from "../actions";

export default async function NewWorkOrderPage({
  searchParams,
}: {
  searchParams: { site?: string };
}) {
  const session = await requireSession();
  if (!isAdmin(session.role)) redirect("/work-orders");
  const supabase = createClient();
  const [{ data: sites }, { data: staff }] = await Promise.all([
    supabase.from("sites").select("id, name").order("name"),
    supabase.from("profiles").select("id, full_name").order("full_name"),
  ]);

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="mb-5 text-xl font-bold">作業指示を作成</h1>
      <WorkOrderForm
        action={createWorkOrder}
        sites={sites || []}
        staff={(staff || []).map((s) => ({ id: s.id, name: s.full_name || "（無名）" }))}
        defaults={{ site_id: searchParams.site }}
        submitLabel="作成する"
        showDispatch
      />
    </div>
  );
}
