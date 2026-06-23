import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireSession, isAdmin } from "@/lib/auth";
import { dispatchWorkOrder } from "@/lib/dispatch";

export const runtime = "nodejs";

export async function POST(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const session = await requireSession();
  if (!isAdmin(session.role)) {
    return NextResponse.json(
      { error: { code: "forbidden", message: "権限がありません" } },
      { status: 403 }
    );
  }
  const supabase = createClient();
  const result = await dispatchWorkOrder(supabase, session.tenantId, params.id);
  return NextResponse.json(result);
}
