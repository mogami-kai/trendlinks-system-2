import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStripe } from "@/lib/stripe";
import { planFromPriceId, type Plan } from "@/lib/plans";
import type Stripe from "stripe";

export const runtime = "nodejs";

/** Stripe Webhook (署名検証 + プラン同期) */
export async function POST(request: Request) {
  const body = await request.text();
  const sig = request.headers.get("stripe-signature");
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!sig || !secret) {
    return NextResponse.json({ error: "no signature" }, { status: 400 });
  }

  const stripe = getStripe();
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, secret);
  } catch (e) {
    return NextResponse.json(
      { error: `signature error: ${(e as Error).message}` },
      { status: 400 }
    );
  }

  const admin = createAdminClient();

  async function syncByCustomer(customerId: string, plan: Plan, status: string, periodEnd?: number, subId?: string) {
    await admin
      .from("subscriptions")
      .update({
        plan,
        status,
        stripe_subscription_id: subId,
        current_period_end: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
        updated_at: new Date().toISOString(),
      })
      .eq("stripe_customer_id", customerId);
    // tenants.plan も同期
    const { data: sub } = await admin
      .from("subscriptions")
      .select("tenant_id")
      .eq("stripe_customer_id", customerId)
      .maybeSingle();
    if (sub) {
      await admin.from("tenants").update({ plan }).eq("id", sub.tenant_id);
    }
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const s = event.data.object as Stripe.Checkout.Session;
      const plan = (s.metadata?.plan as Plan) || "starter";
      if (s.customer) {
        await syncByCustomer(String(s.customer), plan, "active", undefined, String(s.subscription));
      }
      break;
    }
    case "customer.subscription.updated": {
      const sub = event.data.object as Stripe.Subscription;
      const priceId = sub.items.data[0]?.price.id;
      await syncByCustomer(
        String(sub.customer),
        planFromPriceId(priceId),
        sub.status,
        (sub as any).current_period_end,
        sub.id
      );
      break;
    }
    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription;
      await syncByCustomer(String(sub.customer), "free", "canceled", undefined, sub.id);
      break;
    }
    case "invoice.payment_failed": {
      const inv = event.data.object as Stripe.Invoice;
      if (inv.customer) {
        await admin
          .from("subscriptions")
          .update({ status: "past_due", updated_at: new Date().toISOString() })
          .eq("stripe_customer_id", String(inv.customer));
      }
      break;
    }
  }

  return NextResponse.json({ received: true });
}
