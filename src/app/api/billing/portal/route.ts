import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireSession } from "@/lib/auth";
import { getStripe } from "@/lib/stripe";

export const runtime = "nodejs";

export async function POST() {
  try {
    const session = await requireSession();
    if (session.role !== "owner") {
      return NextResponse.json(
        { error: { code: "forbidden", message: "オーナーのみ操作できます" } },
        { status: 403 }
      );
    }
    const admin = createAdminClient();
    const { data: sub } = await admin
      .from("subscriptions")
      .select("stripe_customer_id")
      .eq("tenant_id", session.tenantId)
      .maybeSingle();
    if (!sub?.stripe_customer_id) {
      return NextResponse.json(
        { error: { code: "no_customer", message: "決済情報がありません" } },
        { status: 400 }
      );
    }

    const stripe = getStripe();
    const portal = await stripe.billingPortal.sessions.create({
      customer: sub.stripe_customer_id,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/billing`,
    });
    return NextResponse.json({ url: portal.url });
  } catch (e) {
    return NextResponse.json(
      { error: { code: "error", message: (e as Error).message } },
      { status: 500 }
    );
  }
}
