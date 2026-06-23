import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireSession, isAdmin } from "@/lib/auth";
import { WorkOrderForm } from "../../WorkOrderForm";
import { updateWorkOrder, deleteWorkOrder } from "../../actions";

export default async function EditWorkOrderPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await requireSession();
  if (!isAdmin(session.role)) redirect(`/work-orders/${params.id}`);
  const supabase = createClient();

  const [{ data: wo }, { data: sites }, { data: staff }, { data: assignees }] =
    await Promise.all([
      supabase.from("work_orders").select("*").eq("id", params.id).maybeSingle(),
      supabase.from("sites").select("id, name").order("name"),
      supabase.from("profiles").select("id, full_name").order("full_name"),
      supabase
        .from("work_order_assignees")
        .select("profile_id")
        .eq("work_order_id", params.id),
    ]);
  if (!wo) notFound();

  const updateWithId = updateWorkOrder.bind(null, params.id);
  const deleteWithId = deleteWorkOrder.bind(null, params.id);

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="mb-5 text-xl font-bold">作業指示を編集</h1>
      <WorkOrderForm
        action={updateWithId}
        sites={sites || []}
        staff={(staff || []).map((s) => ({ id: s.id, name: s.full_name || "（無名）" }))}
        defaults={wo}
        defaultAssignees={(assignees || []).map((a) => a.profile_id)}
        submitLabel="更新する"
      />
      <form action={deleteWithId} className="mt-6">
        <button className="btn-danger w-full">この作業指示を削除</button>
      </form>
    </div>
  );
}
