"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import {
  Card,
  CardBody,
  CardHeader,
  EmptyState,
  PageHeader,
  Select,
  StatCard,
  TableWrap,
} from "@/components/ui";
import { createClient } from "@/lib/supabase/browser";
import { formatCurrency, formatDate, monthInputOptions } from "@/lib/format";
import type { JobProfitRow, ManagementCompany } from "@/lib/types";

export default function ManagementPage() {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<JobProfitRow[]>([]);
  const [companies, setCompanies] = useState<Record<string, ManagementCompany>>({});
  const [billingMonth, setBillingMonth] = useState("all");
  const [paymentState, setPaymentState] = useState("all");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const supabase = createClient();
      const [{ data: viewData }, { data: companiesData }] = await Promise.all([
        supabase.from("v_job_profit").select("*").order("billing_month", { ascending: false }),
        supabase.from("management_companies").select("*"),
      ]);

      setRows((viewData ?? []) as JobProfitRow[]);
      setCompanies(
        ((companiesData ?? []) as ManagementCompany[]).reduce<
          Record<string, ManagementCompany>
        >((acc, item) => {
          acc[item.id] = item;
          return acc;
        }, {}),
      );
      setLoading(false);
    };

    void load();
  }, []);

  const filtered = rows.filter((row) => {
    const monthMatch = billingMonth === "all" || row.billing_month === billingMonth;
    let paymentMatch = true;

    if (paymentState === "unbilled") {
      paymentMatch = !row.billed_at;
    } else if (paymentState === "billed") {
      paymentMatch = !!row.billed_at && !row.payment_received_at;
    } else if (paymentState === "paid") {
      paymentMatch = !!row.payment_received_at;
    }

    return monthMatch && paymentMatch;
  });

  const totalOrder = filtered.reduce((sum, row) => sum + (row.order_amount ?? 0), 0);
  const totalOutsource = filtered.reduce(
    (sum, row) => sum + (row.outsourcing_total ?? 0),
    0,
  );
  const totalProfit = filtered.reduce((sum, row) => sum + (row.gross_profit ?? 0), 0);

  return (
    <div>
      <PageHeader
        title="管理表"
        description="案件の経理ライフサイクルを月単位で管理し、受注・外注・粗利・入金を同じ視点で見ます。"
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <StatCard label="案件数" value={`${filtered.length}件`} />
        <StatCard label="受注金額計" value={formatCurrency(totalOrder)} />
        <StatCard
          label="粗利"
          value={formatCurrency(totalProfit)}
          sublabel={`外注合計 ${formatCurrency(totalOutsource)}`}
        />
      </div>

      <Card className="mt-6">
        <CardHeader title="月次一覧" description="請求月と入金状況で絞り込み" />
        <CardBody className="space-y-4">
          <div className="grid gap-3 md:grid-cols-[220px_220px]">
            <Select value={billingMonth} onChange={(event) => setBillingMonth(event.target.value)}>
              <option value="all">すべての月</option>
              {monthInputOptions.map((month) => (
                <option key={month} value={month}>
                  {month}
                </option>
              ))}
            </Select>
            <Select value={paymentState} onChange={(event) => setPaymentState(event.target.value)}>
              <option value="all">すべて</option>
              <option value="unbilled">未請求</option>
              <option value="billed">請求済</option>
              <option value="paid">入金済</option>
            </Select>
          </div>

          {loading ? <p className="text-sm text-slate-500">読み込み中...</p> : null}
          {!loading && filtered.length === 0 ? (
            <EmptyState
              title="該当する案件がありません"
              description="案件詳細で受注金額・請求月・請求日・入金日を入れると、この表に反映されます。"
            />
          ) : null}

          {!loading && filtered.length > 0 ? (
            <TableWrap>
              <table className="min-w-full text-sm">
                <thead className="border-b border-line bg-panel-strong/70 text-left text-slate-500">
                  <tr>
                    <th className="px-4 py-3">案件</th>
                    <th className="px-4 py-3">管理会社</th>
                    <th className="px-4 py-3">請求月</th>
                    <th className="px-4 py-3">受注 / 外注 / 粗利</th>
                    <th className="px-4 py-3">請求 / 入金</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((row) => (
                    <tr key={row.job_id} className="border-b border-line/70 align-top">
                      <td className="px-4 py-3">
                        <Link
                          href={`/dashboard/jobs/${row.job_id}`}
                          className="font-medium text-slate-900 hover:text-slate-700"
                        >
                          {row.title}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {row.management_company_id
                          ? companies[row.management_company_id]?.name ?? "-"
                          : "-"}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {row.billing_month || "未設定"}
                      </td>
                      <td className="px-4 py-3">
                        <p>受注 {formatCurrency(row.order_amount)}</p>
                        <p className="mt-1 text-xs text-slate-500">
                          外注 {formatCurrency(row.outsourcing_total)} / 粗利{" "}
                          {formatCurrency(row.gross_profit)}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        <p>請求 {formatDate(row.billed_at)}</p>
                        <p className="mt-1 text-xs text-slate-500">
                          入金 {formatDate(row.payment_received_at)}
                        </p>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </TableWrap>
          ) : null}
        </CardBody>
      </Card>
    </div>
  );
}
