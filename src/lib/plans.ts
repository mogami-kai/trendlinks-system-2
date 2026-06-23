/** プラン定義・上限・機能ゲート (要件定義 08章準拠) */

export type Plan = "free" | "starter" | "pro";

export interface PlanConfig {
  label: string;
  priceJpy: number;
  maxSites: number; // -1 = 無制限
  maxStaff: number;
  gpsArrival: boolean; // FR-5
  pdfReport: boolean; // FR-6
}

export const PLANS: Record<Plan, PlanConfig> = {
  free: {
    label: "Free",
    priceJpy: 0,
    maxSites: 3,
    maxStaff: 5,
    gpsArrival: false,
    pdfReport: false,
  },
  starter: {
    label: "Starter",
    priceJpy: 1980,
    maxSites: 20,
    maxStaff: 20,
    gpsArrival: false,
    pdfReport: false,
  },
  pro: {
    label: "Pro",
    priceJpy: 4980,
    maxSites: -1,
    maxStaff: -1,
    gpsArrival: true,
    pdfReport: true,
  },
};

export function isUnlimited(n: number) {
  return n < 0;
}

export function canAddMore(plan: Plan, kind: "sites" | "staff", current: number) {
  const limit = kind === "sites" ? PLANS[plan].maxSites : PLANS[plan].maxStaff;
  return isUnlimited(limit) || current < limit;
}

export function hasFeature(plan: Plan, feature: "gpsArrival" | "pdfReport") {
  return PLANS[plan][feature];
}

/** Stripe Price ID → plan の逆引き (Webhook 用) */
export function planFromPriceId(priceId: string | null | undefined): Plan {
  if (!priceId) return "free";
  if (priceId === process.env.STRIPE_PRICE_PRO) return "pro";
  if (priceId === process.env.STRIPE_PRICE_STARTER) return "starter";
  return "free";
}

export function priceIdForPlan(plan: Plan): string | undefined {
  if (plan === "pro") return process.env.STRIPE_PRICE_PRO;
  if (plan === "starter") return process.env.STRIPE_PRICE_STARTER;
  return undefined;
}
