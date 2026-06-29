"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

import {
  Button,
  Card,
  CardBody,
  CardHeader,
  DataGrid,
  EmptyState,
  Field,
  Input,
  PageHeader,
  Select,
  TableWrap,
  Textarea,
} from "@/components/ui";
import { formatCurrency } from "@/lib/format";
import { createClient } from "@/lib/supabase/browser";
import type { Category, Contractor, ContractorPrice, WorkItem } from "@/lib/types";

export default function ContractorDetailPage() {
  const params = useParams<{ id: string }>();
  const contractorId = params.id;

  const [loading, setLoading] = useState(true);
  const [contractor, setContractor] = useState<Contractor | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [workItems, setWorkItems] = useState<WorkItem[]>([]);
  const [prices, setPrices] = useState<ContractorPrice[]>([]);
  const [form, setForm] = useState<Partial<Contractor>>({});

  const load = async () => {
    setLoading(true);
    const supabase = createClient();
    const [
      { data: contractorData },
      { data: categoryData },
      { data: workItemData },
      { data: priceData },
    ] = await Promise.all([
      supabase.from("contractors").select("*").eq("id", contractorId).single(),
      supabase.from("categories").select("*").eq("kind", "contractor").order("sort_order"),
      supabase.from("work_items").select("*").eq("is_active", true).order("sort_order"),
      supabase.from("contractor_prices").select("*").eq("contractor_id", contractorId),
    ]);

    const current = (contractorData ?? null) as Contractor | null;
    setContractor(current);
    setForm(current ?? {});
    setCategories((categoryData ?? []) as Category[]);
    setWorkItems((workItemData ?? []) as WorkItem[]);
    setPrices((priceData ?? []) as ContractorPrice[]);
    setLoading(false);
  };

  useEffect(() => {
    void load();
  }, [contractorId]);

  const saveContractor = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const supabase = createClient();
    const { error } = await supabase
      .from("contractors")
      .update(form)
      .eq("id", contractorId);

    if (error) {
      alert(`更新失敗: ${error.message}`);
      return;
    }

    void load();
  };

  const setPrice = async (workItem: WorkItem) => {
    const current = prices.find((price) => price.work_item_id === workItem.id);
    const unitPriceText = window.prompt(
      `${workItem.name} の単価`,
      current?.unit_price?.toString() ?? "",
    );

    if (unitPriceText === null) {
      return;
    }

    const unitText = window.prompt(
      `${workItem.name} の単位`,
      current?.unit ?? workItem.default_unit ?? "",
    );

    if (unitText === null) {
      return;
    }

    const supabase = createClient();

    if (!unitPriceText) {
      if (current) {
        const { error } = await supabase
          .from("contractor_prices")
          .delete()
          .eq("id", current.id);
        if (error) {
          alert(`削除失敗: ${error.message}`);
          return;
        }
      }
    } else if (current) {
      const { error } = await supabase
        .from("contractor_prices")
        .update({
          unit_price: Number(unitPriceText),
          unit: unitText || null,
        })
        .eq("id", current.id);
      if (error) {
        alert(`更新失敗: ${error.message}`);
        return;
      }
    } else {
      const { error } = await supabase.from("contractor_prices").insert([
        {
          contractor_id: contractorId,
          work_item_id: workItem.id,
          unit_price: Number(unitPriceText),
          unit: unitText || null,
          is_unavailable: false,
        },
      ]);
      if (error) {
        alert(`登録失敗: ${error.message}`);
        return;
      }
    }

    void load();
  };

  if (loading) {
    return <p className="text-sm text-slate-500">読み込み中...</p>;
  }

  if (!contractor) {
    return <p className="text-sm text-slate-500">業者が見つかりません。</p>;
  }

  return (
    <div>
      <PageHeader
        title={contractor.name}
        description="業者情報と、工事項目ごとの単価を設定します。"
        action={
          <Link
            href="/dashboard/contractors"
            className="inline-flex items-center gap-2 rounded-xl border border-line bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-panel-strong"
          >
            <ArrowLeft size={14} />
            業者一覧
          </Link>
        }
      />

      <DataGrid className="xl:grid-cols-[0.9fr_1.1fr]">
        <Card>
          <CardHeader title="業者情報" description="下請業者の基本情報を更新" />
          <CardBody>
            <form className="space-y-4" onSubmit={saveContractor}>
              <Field label="業者名">
                <Input
                  value={form.name ?? ""}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, name: event.target.value }))
                  }
                />
              </Field>
              <Field label="カテゴリ">
                <Select
                  value={form.category ?? ""}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      category: event.target.value,
                    }))
                  }
                >
                  {categories.map((category) => (
                    <option key={category.id} value={category.name}>
                      {category.name}
                    </option>
                  ))}
                </Select>
              </Field>
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="電話1">
                  <Input
                    value={form.phone ?? ""}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        phone: event.target.value,
                      }))
                    }
                  />
                </Field>
                <Field label="電話2">
                  <Input
                    value={form.phone2 ?? ""}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        phone2: event.target.value,
                      }))
                    }
                  />
                </Field>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="担当者">
                  <Input
                    value={form.contact_person ?? ""}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        contact_person: event.target.value,
                      }))
                    }
                  />
                </Field>
                <Field label="FAX">
                  <Input
                    value={form.fax ?? ""}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        fax: event.target.value,
                      }))
                    }
                  />
                </Field>
              </div>
              <Field label="メール">
                <Input
                  value={form.email ?? ""}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      email: event.target.value,
                    }))
                  }
                />
              </Field>
              <Field label="対応エリア">
                <Input
                  value={form.area ?? ""}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      area: event.target.value,
                    }))
                  }
                />
              </Field>
              <Field label="支払条件">
                <Input
                  value={form.payment_terms ?? ""}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      payment_terms: event.target.value,
                    }))
                  }
                />
              </Field>
              <Field label="依頼書送付方法">
                <Input
                  value={form.request_method ?? ""}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      request_method: event.target.value,
                    }))
                  }
                />
              </Field>
              <Field label="備考">
                <Textarea
                  rows={4}
                  value={form.notes ?? ""}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      notes: event.target.value,
                    }))
                  }
                />
              </Field>
              <Button type="submit">保存</Button>
            </form>
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            title="工事項目別単価"
            description="項目ごとに単価と単位を登録。空欄保存で解除できます。"
          />
          <CardBody>
            {workItems.length === 0 ? (
              <EmptyState
                title="工事項目がまだ登録されていません"
                description="先に設定画面から工事項目マスターを整備してください。"
              />
            ) : (
              <TableWrap>
                <table className="min-w-full text-sm">
                  <thead className="border-b border-line bg-panel-strong/70 text-left text-slate-500">
                    <tr>
                      <th className="px-4 py-3">項目</th>
                      <th className="px-4 py-3">カテゴリ</th>
                      <th className="px-4 py-3">単価</th>
                      <th className="px-4 py-3 text-right">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {workItems.map((workItem) => {
                      const price = prices.find(
                        (item) => item.work_item_id === workItem.id,
                      );

                      return (
                        <tr
                          key={workItem.id}
                          className="border-b border-line/70 align-top"
                        >
                          <td className="px-4 py-3">
                            <p className="font-medium text-slate-900">
                              {workItem.name}
                            </p>
                            <p className="mt-1 text-xs text-slate-500">
                              {workItem.default_description || "摘要未設定"}
                            </p>
                          </td>
                          <td className="px-4 py-3 text-slate-600">
                            {workItem.category}
                          </td>
                          <td className="px-4 py-3">
                            {price ? (
                              <div>
                                <p className="font-medium text-slate-900">
                                  {formatCurrency(price.unit_price)}
                                </p>
                                <p className="mt-1 text-xs text-slate-500">
                                  / {price.unit || workItem.default_unit || "-"}
                                </p>
                              </div>
                            ) : (
                              <span className="text-xs text-slate-400">未設定</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <Button
                              type="button"
                              variant="secondary"
                              onClick={() => void setPrice(workItem)}
                            >
                              編集
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </TableWrap>
            )}
          </CardBody>
        </Card>
      </DataGrid>
    </div>
  );
}
