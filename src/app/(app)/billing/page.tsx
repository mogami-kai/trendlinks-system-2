import { redirect } from "next/navigation";
import { requireSession } from "@/lib/auth";
import { PageHeader } from "@/components/PageHeader";
import { PLANS } from "@/lib/plans";
import { CheckoutButton, PortalButton } from "./BillingButtons";

export default async function BillingPage() {
  const session = await requireSession();
  if (session.role !== "owner") redirect("/dashboard");

  return (
    <div>
      <PageHeader title="プラン・決済" />
      <p className="mb-5 text-sm text-slate-500">
        現在のプラン: <span className="font-semibold">{PLANS[session.plan].label}</span>
      </p>

      <div className="grid gap-5 sm:grid-cols-3">
        {(["free", "starter", "pro"] as const).map((p) => (
          <div key={p} className="card flex flex-col">
            <h3 className="text-lg font-bold">{PLANS[p].label}</h3>
            <p className="mt-2 text-2xl font-bold">
              ¥{PLANS[p].priceJpy.toLocaleString()}
              <span className="text-sm font-normal text-slate-500">/月</span>
            </p>
            <ul className="mt-4 flex-1 space-y-1 text-sm text-slate-600">
              <li>現場: {PLANS[p].maxSites < 0 ? "無制限" : `${PLANS[p].maxSites}件`}</li>
              <li>スタッフ: {PLANS[p].maxStaff < 0 ? "無制限" : `${PLANS[p].maxStaff}名`}</li>
              <li>{PLANS[p].gpsArrival ? "✓" : "—"} GPS到着確認</li>
              <li>{PLANS[p].pdfReport ? "✓" : "—"} 顧客報告書PDF</li>
            </ul>
            <div className="mt-5">
              {session.plan === p ? (
                <span className="badge bg-brand-100 text-brand-700">利用中</span>
              ) : p === "free" ? (
                <span className="text-sm text-slate-400">無料</span>
              ) : (
                <CheckoutButton plan={p} label={`${PLANS[p].label}にする`} />
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6">
        <PortalButton />
      </div>
    </div>
  );
}
