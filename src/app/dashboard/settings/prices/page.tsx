"use client";

import { useEffect, useState } from "react";

import {
  Button,
  Card,
  CardBody,
  CardHeader,
  EmptyState,
  PageHeader,
  Select,
  TableWrap,
} from "@/components/ui";
import { formatCurrency } from "@/lib/format";
import { createClient } from "@/lib/supabase/browser";
import type { Category, QuotePrice, TenantPrice, WorkItem } from "@/lib/types";

type Row = {
  workItem: WorkItem;
  tenantPrice: TenantPrice | null;
  quotePrice: QuotePrice | null;
};

export default function SettingsPricesPage() {
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState("すべて");
  const [categories, setCategories] = useState<Category[]>([]);
  const [rows, setRows] = useState<Row[]>([]);

  const load = async () => {
    setLoading(true);
    const supabase = createClient();
    const [
      { data: itemsData },
      { data: tenantData },
      { data: quoteData },
      { data: categoryData },
    ] = await Promise.all([
      supabase.from("work_items").select("*").eq("is_active", true).order("sort_order"),
      supabase.from("tenant_prices").select("*"),
      supabase.from("quote_prices").select("*"),
      supabase
        .from("categories")
        .select("*")
        .eq("kind", "work_item")
        .order("sort_order"),
    ]);

    const tenantMap = new Map(
      ((tenantData ?? []) as TenantPrice[]).map((item) => [item.work_item_id, item]),
    );
    const quoteMap = new Map(
      ((quoteData ?? []) as QuotePrice[]).map((item) => [item.work_item_id, item]),
    );

    setRows(
      ((itemsData ?? []) as WorkItem[]).map((workItem) => ({
        workItem,
        tenantPrice: tenantMap.get(workItem.id) ?? null,
        quotePrice: quoteMap.get(workItem.id) ?? null,
      })),
    );
    setCategories((categoryData ?? []) as Category[]);
    setLoading(false);
  };

  useEffect(() => {
    void load();
  }, []);

  const savePrices = async (row: Row) => {
    const tenantPrice = window.prompt(
      `${row.workItem.name} / 入居者請求の単価`,
      row.tenantPrice?.unit_price?.toString() ?? "",
    );
    if (tenantPrice === null) {
      return;
    }
    const tenantUnit = window.prompt(
      `${row.workItem.name} / 入居者請求の単位`,
      row.tenantPrice?.unit ?? row.workItem.default_unit ?? "",
    );
    if (tenantUnit === null) {
      return;
    }
    const quotePrice = window.prompt(
      `${row.workItem.name} / 見積の単価`,
      row.quotePrice?.unit_price?.toString() ?? "",
    );
    if (quotePrice === null) {
      return;
    }
    const quoteUnit = window.prompt(
      `${row.workItem.name} / 見積の単位`,
      row.quotePrice?.unit ?? row.workItem.default_unit ?? "",
    );
    if (quoteUnit === null) {
      return;
    }

    const supabase = createClient();

    if (tenantPrice) {
      const payload = {
        work_item_id: row.workItem.id,
        unit_price: Number(tenantPrice),
        unit: tenantUnit || null,
      };
      if (row.tenantPrice) {
        await supabase.from("tenant_prices").update(payload).eq("id", row.tenantPrice.id);
      } else {
        await supabase.from("tenant_prices").insert([payload]);
      }
    } else if (row.tenantPrice) {
      await supabase.from("tenant_prices").delete().eq("id", row.tenantPrice.id);
    }

    if (quotePrice) {
      const payload = {
        work_item_id: row.workItem.id,
        unit_price: Number(quotePrice),
        unit: quoteUnit || null,
      };
      if (row.quotePrice) {
        await supabase.from("quote_prices").update(payload).eq("id", row.quotePrice.id);
      } else {
        await supabase.from("quote_prices").insert([payload]);
      }
    } else if (row.quotePrice) {
      await supabase.from("quote_prices").delete().eq("id", row.quotePrice.id);
    }

    void load();
  };

  const filtered = rows.filter(
    (row) => category === "すべて" || row.workItem.category === category,
  );

  return (
    <div>
      <PageHeader
        title="単価マスター"
        description="入居者請求用・見積用の単価を設定します。下請単価は各業者詳細画面で管理します。"
      />

      <Card>
        <CardHeader
          title="工事項目別単価"
          description="編集で 2 種類の単価を同時入力。空欄で保存すると解除されます。"
        />
        <CardBody className="space-y-4">
          <div className="max-w-xs">
            <Select value={category} onChange={(event) => setCategory(event.target.value)}>
              <option value="すべて">すべて</option>
              {categories.map((item) => (
                <option key={item.id} value={item.name}>
                  {item.name}
                </option>
              ))}
            </Select>
          </div>

          {loading ? <p className="text-sm text-slate-500">読み込み中...</p> : null}
          {!loading && filtered.length === 0 ? (
            <EmptyState
              title="工事項目がまだ登録されていません"
              description="先に工事項目マスターを作成してください。"
            />
          ) : null}

          {!loading && filtered.length > 0 ? (
            <TableWrap>
              <table className="min-w-full text-sm">
                <thead className="border-b border-line bg-panel-strong/70 text-left text-slate-500">
                  <tr>
                    <th className="px-4 py-3">項目</th>
                    <th className="px-4 py-3">入居者請求</th>
                    <th className="px-4 py-3">見積</th>
                    <th className="px-4 py-3 text-right">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((row) => (
                    <tr key={row.workItem.id} className="border-b border-line/70">
                      <td className="px-4 py-3">
                        <p className="font-medium text-slate-900">{row.workItem.name}</p>
                        <p className="mt-1 text-xs text-slate-500">
                          {row.workItem.category} / 単位 {row.workItem.default_unit || "-"}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        {row.tenantPrice ? (
                          <>
                            <p className="font-medium text-slate-900">
                              {formatCurrency(row.tenantPrice.unit_price)}
                            </p>
                            <p className="mt-1 text-xs text-slate-500">
                              / {row.tenantPrice.unit || "-"}
                            </p>
                          </>
                        ) : (
                          <span className="text-xs text-slate-400">未設定</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {row.quotePrice ? (
                          <>
                            <p className="font-medium text-slate-900">
                              {formatCurrency(row.quotePrice.unit_price)}
                            </p>
                            <p className="mt-1 text-xs text-slate-500">
                              / {row.quotePrice.unit || "-"}
                            </p>
                          </>
                        ) : (
                          <span className="text-xs text-slate-400">未設定</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button
                          type="button"
                          variant="secondary"
                          onClick={() => void savePrices(row)}
                        >
                          編集
                        </Button>
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
