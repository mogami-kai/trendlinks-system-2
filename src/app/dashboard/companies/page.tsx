"use client";

import Link from "next/link";
import { Building2, ChevronRight, Plus } from "lucide-react";
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
  TableWrap,
  Textarea,
} from "@/components/ui";
import { createClient } from "@/lib/supabase/browser";
import type { ManagementCompany, Property } from "@/lib/types";

const emptyCompany = {
  name: "",
  address: "",
  phone: "",
  fax: "",
  email: "",
  contact_person: "",
  payment_terms: "",
  notes: "",
};

export default function CompaniesPage() {
  const [companies, setCompanies] = useState<ManagementCompany[]>([]);
  const [propertyCounts, setPropertyCounts] = useState<Record<string, number>>({});
  const [form, setForm] = useState(emptyCompany);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const supabase = createClient();
    const [{ data: companiesData }, { data: propertiesData }] = await Promise.all([
      supabase.from("management_companies").select("*").order("name"),
      supabase.from("properties").select("id, management_company_id"),
    ]);

    const counts = ((propertiesData ?? []) as Pick<
      Property,
      "management_company_id"
    >[]).reduce<Record<string, number>>((acc, item) => {
      acc[item.management_company_id] = (acc[item.management_company_id] ?? 0) + 1;
      return acc;
    }, {});

    setCompanies((companiesData ?? []) as ManagementCompany[]);
    setPropertyCounts(counts);
    setLoading(false);
  };

  useEffect(() => {
    void load();
  }, []);

  const resetForm = () => {
    setForm(emptyCompany);
    setEditingId(null);
  };

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    const supabase = createClient();
    const payload = {
      ...form,
      name: form.name.trim(),
    };

    const query = editingId
      ? supabase.from("management_companies").update(payload).eq("id", editingId)
      : supabase.from("management_companies").insert([payload]);

    const { error } = await query;

    setSaving(false);

    if (error) {
      alert(`保存に失敗しました: ${error.message}`);
      return;
    }

    resetForm();
    void load();
  };

  const onDelete = async (company: ManagementCompany) => {
    if (!window.confirm(`「${company.name}」を削除しますか？`)) {
      return;
    }

    const supabase = createClient();
    const { error } = await supabase
      .from("management_companies")
      .delete()
      .eq("id", company.id);

    if (error) {
      alert(`削除に失敗しました: ${error.message}`);
      return;
    }

    if (editingId === company.id) {
      resetForm();
    }
    void load();
  };

  return (
    <div>
      <PageHeader
        title="管理会社"
        description="物件を管理している不動産会社・管理会社の一覧。案件の起点になる会社情報をここで整えます。"
      />

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <Card>
          <CardHeader
            title={editingId ? "管理会社を編集" : "新規追加"}
            description="会社情報、担当者、支払条件、備考を管理"
          />
          <CardBody>
            <form className="space-y-4" onSubmit={onSubmit}>
              <Field label="会社名 *">
                <Input
                  value={form.name}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, name: event.target.value }))
                  }
                  required
                />
              </Field>
              <Field label="住所">
                <Input
                  value={form.address}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      address: event.target.value,
                    }))
                  }
                />
              </Field>
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="電話">
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
                <Field label="FAX">
                  <Input
                    value={form.fax}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        fax: event.target.value,
                      }))
                    }
                  />
                </Field>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="メール">
                  <Input
                    type="email"
                    value={form.email}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        email: event.target.value,
                      }))
                    }
                  />
                </Field>
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
              </div>
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

              <div className="flex flex-wrap gap-3">
                <Button type="submit" disabled={saving}>
                  <Plus size={14} />
                  {saving ? "保存中..." : "保存"}
                </Button>
                {editingId ? (
                  <Button type="button" variant="secondary" onClick={resetForm}>
                    キャンセル
                  </Button>
                ) : null}
              </div>
            </form>
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            title="管理会社一覧"
            description="物件数つきで確認し、詳細画面から配下の物件を管理"
          />
          <CardBody>
            {loading ? <p className="text-sm text-slate-500">読み込み中...</p> : null}
            {!loading && companies.length === 0 ? (
              <EmptyState
                title="管理会社がまだ登録されていません"
                description="右のフォームから最初の管理会社を登録してください。"
              />
            ) : null}

            {!loading && companies.length > 0 ? (
              <TableWrap>
                <table className="min-w-full text-sm">
                  <thead className="border-b border-line bg-panel-strong/70 text-left text-slate-500">
                    <tr>
                      <th className="px-4 py-3">管理会社</th>
                      <th className="px-4 py-3">担当者</th>
                      <th className="px-4 py-3">物件</th>
                      <th className="px-4 py-3 text-right">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {companies.map((company) => (
                      <tr key={company.id} className="border-b border-line/70">
                        <td className="px-4 py-3">
                          <p className="font-medium text-slate-900">{company.name}</p>
                          <p className="mt-1 text-xs text-slate-500">
                            {company.address || "住所未設定"}
                          </p>
                        </td>
                        <td className="px-4 py-3 text-slate-600">
                          {company.contact_person || "-"}
                        </td>
                        <td className="px-4 py-3 text-slate-600">
                          {propertyCounts[company.id] ?? 0}件
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              type="button"
                              variant="ghost"
                              onClick={() => {
                                setEditingId(company.id);
                                setForm({
                                  name: company.name ?? "",
                                  address: company.address ?? "",
                                  phone: company.phone ?? "",
                                  fax: company.fax ?? "",
                                  email: company.email ?? "",
                                  contact_person: company.contact_person ?? "",
                                  payment_terms: company.payment_terms ?? "",
                                  notes: company.notes ?? "",
                                });
                              }}
                            >
                              編集
                            </Button>
                            <Link
                              href={`/dashboard/companies/${company.id}`}
                              className="inline-flex items-center gap-1 rounded-xl bg-slate-100 px-3 py-2 font-medium text-slate-700 hover:bg-slate-200"
                            >
                              詳細
                              <ChevronRight size={14} />
                            </Link>
                            <Button
                              type="button"
                              variant="danger"
                              onClick={() => void onDelete(company)}
                            >
                              削除
                            </Button>
                          </div>
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
