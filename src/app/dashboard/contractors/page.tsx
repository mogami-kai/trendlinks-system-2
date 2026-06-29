"use client";

import Link from "next/link";
import { ChevronRight, Plus } from "lucide-react";
import { useEffect, useState } from "react";

import {
  Button,
  Card,
  CardBody,
  CardHeader,
  EmptyState,
  Field,
  Input,
  PageHeader,
  Select,
  TableWrap,
  Textarea,
} from "@/components/ui";
import { createClient } from "@/lib/supabase/browser";
import type { Category, Contractor, ContractorPrice } from "@/lib/types";

const emptyForm = {
  name: "",
  category: "",
  phone: "",
  phone2: "",
  email: "",
  fax: "",
  area: "",
  payment_terms: "",
  request_method: "LINE",
  contact_person: "",
  notes: "",
};

export default function ContractorsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [contractors, setContractors] = useState<Contractor[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [priceCounts, setPriceCounts] = useState<Record<string, number>>({});
  const [form, setForm] = useState(emptyForm);

  const load = async () => {
    setLoading(true);
    const supabase = createClient();
    const [{ data: contractorData }, { data: categoryData }, { data: priceData }] =
      await Promise.all([
        supabase.from("contractors").select("*").order("name"),
        supabase
          .from("categories")
          .select("*")
          .eq("kind", "contractor")
          .order("sort_order"),
        supabase.from("contractor_prices").select("id, contractor_id"),
      ]);

    const categoryList = (categoryData ?? []) as Category[];
    setCategories(categoryList);
    setForm((current) => ({
      ...current,
      category: current.category || categoryList[0]?.name || "",
    }));
    setContractors((contractorData ?? []) as Contractor[]);
    setPriceCounts(
      ((priceData ?? []) as Pick<ContractorPrice, "contractor_id">[]).reduce<
        Record<string, number>
      >((acc, item) => {
        acc[item.contractor_id] = (acc[item.contractor_id] ?? 0) + 1;
        return acc;
      }, {}),
    );
    setLoading(false);
  };

  useEffect(() => {
    void load();
  }, []);

  const addContractor = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    const supabase = createClient();
    const { error } = await supabase.from("contractors").insert([
      {
        ...form,
        is_tax_excluded: true,
        is_active: true,
      },
    ]);

    setSaving(false);

    if (error) {
      alert(`登録に失敗しました: ${error.message}`);
      return;
    }

    setForm({
      ...emptyForm,
      category: categories[0]?.name || "",
    });
    void load();
  };

  const addCategory = async () => {
    const name = window.prompt("新しい業種名");
    if (!name?.trim()) {
      return;
    }

    const max = categories.reduce((acc, item) => Math.max(acc, item.sort_order), 0);
    const supabase = createClient();
    const { error } = await supabase.from("categories").insert([
      {
        kind: "contractor",
        name: name.trim(),
        sort_order: max + 10,
        is_active: true,
      },
    ]);

    if (error) {
      alert(`追加に失敗しました: ${error.message}`);
      return;
    }

    void load();
  };

  return (
    <div>
      <PageHeader
        title="職人(下請業者)"
        description="工事を委託する業者の管理。カテゴリ、対応エリア、支払条件、単価設定への導線をまとめます。"
        action={
          <Button type="button" variant="secondary" onClick={() => void addCategory()}>
            業種を管理
          </Button>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <Card>
          <CardHeader title="新規追加" description="下請業者の基本情報を登録" />
          <CardBody>
            <form className="space-y-4" onSubmit={addContractor}>
              <Field label="業者名 *">
                <Input
                  value={form.name}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, name: event.target.value }))
                  }
                  required
                />
              </Field>
              <Field label="カテゴリ">
                <Select
                  value={form.category}
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
                    value={form.phone}
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
                    value={form.phone2}
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
                <Field label="担当者名">
                  <Input
                    value={form.contact_person}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        contact_person: event.target.value,
                      }))
                    }
                  />
                </Field>
                <Field label="依頼書送付方法">
                  <Input
                    value={form.request_method}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        request_method: event.target.value,
                      }))
                    }
                  />
                </Field>
              </div>
              <Field label="対応エリア">
                <Input
                  value={form.area}
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
                  value={form.payment_terms}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      payment_terms: event.target.value,
                    }))
                  }
                />
              </Field>
              <Field label="備考">
                <Textarea
                  rows={4}
                  value={form.notes}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      notes: event.target.value,
                    }))
                  }
                />
              </Field>
              <Button type="submit" disabled={saving}>
                <Plus size={14} />
                {saving ? "登録中..." : "業者を追加"}
              </Button>
            </form>
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            title="業者一覧"
            description="業者詳細ではカテゴリ別の工事項目単価まで設定できます。"
          />
          <CardBody>
            {loading ? <p className="text-sm text-slate-500">読み込み中...</p> : null}
            {!loading && contractors.length === 0 ? (
              <EmptyState
                title="業者がまだ登録されていません"
                description="右のフォームから最初の業者を追加してください。"
              />
            ) : null}

            {!loading && contractors.length > 0 ? (
              <TableWrap>
                <table className="min-w-full text-sm">
                  <thead className="border-b border-line bg-panel-strong/70 text-left text-slate-500">
                    <tr>
                      <th className="px-4 py-3">業者</th>
                      <th className="px-4 py-3">カテゴリ</th>
                      <th className="px-4 py-3">単価</th>
                      <th className="px-4 py-3 text-right">詳細</th>
                    </tr>
                  </thead>
                  <tbody>
                    {contractors.map((contractor) => (
                      <tr key={contractor.id} className="border-b border-line/70">
                        <td className="px-4 py-3">
                          <p className="font-medium text-slate-900">
                            {contractor.name}
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            {contractor.area || "対応エリア未設定"}
                          </p>
                        </td>
                        <td className="px-4 py-3 text-slate-600">
                          {contractor.category || "その他"}
                        </td>
                        <td className="px-4 py-3 text-slate-600">
                          {priceCounts[contractor.id] ?? 0}件
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Link
                            href={`/dashboard/contractors/${contractor.id}`}
                            className="inline-flex items-center gap-1 rounded-xl bg-slate-100 px-3 py-2 font-medium text-slate-700 hover:bg-slate-200"
                          >
                            詳細
                            <ChevronRight size={14} />
                          </Link>
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
    </div>
  );
}
