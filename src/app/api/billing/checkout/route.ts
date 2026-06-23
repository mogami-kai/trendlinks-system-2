import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireSession } from "@/lib/auth";
import { getStripe } from "@/lib/stripe";
import { priceIdForPlan, type Plan } from "@/lib/plans";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const session = await requireSession();
    if (session.role !== "owner") {
      return NextResponse.json(
        { error: { code: "forbidden", message: "オーナーのみ操作できます" } },
        { status: 403 }
      );
    }
    const { plan } = (await request.json()) as { plan: Plan };
    const priceId = priceIdForPlan(plan);
    if (!priceId) {
      return NextResponse.json(
        { error: { code: "bad_plan", message: "無効なプランです" } },
        { status: 400 }
      );
    }

    const stripe = getStripe();
    const admin = createAdminClient();

    // 既存の Stripe 顧客IDを取得 or 作成
    const { data: sub } = await admin
      .from("subscriptions")
      .select("stripe_customer_id")
      .eq("tenant_id", session.tenantId)
      .maybeSingle();

    let customerId = sub?.stripe_customer_id;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: session.email,
        metadata: { tenant_id: session.tenantId },
      });
      customerId = customer.id;
      await admin
        .from("subscriptions")
        .update({ stripe_customer_id: customerId })
        .eq("tenant_id", session.tenantId);
    }

    const checkout = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/billing?success=1`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/billing?canceled=1`,
      metadata: { tenant_id: session.tenantId, plan },
    });

    return NextResponse.json({ url: checkout.url });
  } catch (e) {
    return NextResponse.json(
      { error: { code: "error", message: (e as Error).message } },
      { status: 500 }
    );
  }
}
