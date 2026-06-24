"use client";

import Link from "next/link";
import { ArrowLeft, Building2, Plus } from "lucide-react";
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
  Textarea,
} from "@/components/ui";
import { createClient } from "@/lib/supabase/browser";
import type { ManagementCompany, Property } from "@/lib/types";

const emptyProperty = {
  name: "",
  address: "",
  notes: "",
};

export default function CompanyDetailPage() {
  const params = useParams<{ id: string }>();
  const companyId = params.id;

  const [company, setCompany] = useState<ManagementCompany | null>(null);
  const [properties, setProperties] = useState<Property[]>([]);
  const [companyForm, setCompanyForm] = useState<Partial<ManagementCompany>>({});
  const [propertyForm, setPropertyForm] = useState(emptyProperty);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const supabase = createClient();
    const [{ data: companyData }, { data: propertyData }] = await Promise.all([
      supabase.from("management_companies").select("*").eq("id", companyId).single(),
      supabase
        .from("properties")
        .select("*")
        .eq("management_company_id", companyId)
        .order("name"),
    ]);

    const item = (companyData ?? null) as ManagementCompany | null;
    setCompany(item);
    setCompanyForm(item ?? {});
    setProperties((propertyData ?? []) as Property[]);
    setLoading(false);
  };

  useEffect(() => {
    void load();
  }, [companyId]);

  const saveCompany = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);

    const supabase = createClient();
    const { error } = await supabase
      .from("management_companies")
      .update(companyForm)
      .eq("id", companyId);

    setSaving(false);

    if (error) {
      alert(`更新失敗: ${error.message}`);
      return;
    }

    void load();
  };

  const addProperty = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const supabase = createClient();
    const { error } = await supabase.from("properties").insert([
      {
        management_company_id: companyId,
        name: propertyForm.name.trim(),
        address: propertyForm.address || null,
        notes: propertyForm.notes || null,
      },
    ]);

    if (error) {
      alert(`登録に失敗しました: ${error.message}`);
      return;
    }

    setPropertyForm(emptyProperty);
    void load();
  };

  const deleteProperty = async (property: Property) => {
    if (!window.confirm(`「${property.name}」を削除しますか？`)) {
      return;
    }

    const supabase = createClient();
    const { error } = await supabase.from("properties").delete().eq("id", property.id);

    if (error) {
      alert(`削除に失敗しました: ${error.message}`);
      return;
    }

    void load();
  };

  if (loading) {
    return <p className="text-sm text-slate-500">読み込み中...</p>;
  }

  if (!company) {
    return <p className="text-sm text-slate-500">管理会社が見つかりません。</p>;
  }

  return (
    <div>
      <PageHeader
        title={company.name}
        description="会社情報と、この管理会社配下の物件一覧をまとめて管理します。"
        action={
          <Link
            href="/dashboard/companies"
            className="inline-flex items-center gap-2 rounded-xl border border-line bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-panel-strong"
          >
            <ArrowLeft size={14} />
            管理会社一覧
          </Link>
        }
      />

      <DataGrid className="xl:grid-cols-[0.95fr_1.05fr]">
        <Card>
          <CardHeader
            title="管理会社情報"
            description="住所、担当者、支払条件を更新"
          />
          <CardBody>
            <form className="space-y-4" onSubmit={saveCompany}>
              <Field label="会社名">
                <Input
                  value={companyForm.name ?? ""}
                  onChange={(event) =>
                    setCompanyForm((current) => ({
                      ...current,
                      name: event.target.value,
                    }))
                  }
                />
              </Field>
              <Field label="住所">
                <Input
                  value={companyForm.address ?? ""}
                  onChange={(event) =>
                    setCompanyForm((current) => ({
                      ...current,
                      address: event.target.value,
                    }))
                  }
                />
              </Field>
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="電話">
                  <Input
                    value={companyForm.phone ?? ""}
                    onChange={(event) =>
                      setCompanyForm((current) => ({
                        ...current,
                        phone: event.target.value,
                      }))
                    }
                  />
                </Field>
                <Field label="FAX">
                  <Input
                    value={companyForm.fax ?? ""}
                    onChange={(event) =>
                      setCompanyForm((current) => ({
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
                    value={companyForm.email ?? ""}
                    onChange={(event) =>
                      setCompanyForm((current) => ({
                        ...current,
                        email: event.target.value,
                      }))
                    }
                  />
                </Field>
                <Field label="担当者">
                  <Input
                    value={companyForm.contact_person ?? ""}
                    onChange={(event) =>
                      setCompanyForm((current) => ({
                        ...current,
                        contact_person: event.target.value,
                      }))
                    }
                  />
                </Field>
              </div>
              <Field label="支払条件">
                <Input
                  value={companyForm.payment_terms ?? ""}
                  onChange={(event) =>
                    setCompanyForm((current) => ({
                      ...current,
                      payment_terms: event.target.value,
                    }))
                  }
                />
              </Field>
              <Field label="備考">
                <Textarea
                  rows={4}
                  value={companyForm.notes ?? ""}
                  onChange={(event) =>
                    setCompanyForm((current) => ({
                      ...current,
                      notes: event.target.value,
                    }))
                  }
                />
              </Field>
              <Button type="submit" disabled={saving}>
                {saving ? "保存中..." : "保存"}
              </Button>
            </form>
          </CardBody>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader
              title="物件を追加"
              description="この管理会社の配下に新しい物件を登録"
            />
            <CardBody>
              <form className="space-y-4" onSubmit={addProperty}>
                <Field label="物件名 *">
                  <Input
                    value={propertyForm.name}
                    onChange={(event) =>
                      setPropertyForm((current) => ({
                        ...current,
                        name: event.target.value,
                      }))
                    }
                    required
                  />
                </Field>
                <Field label="住所">
                  <Input
                    value={propertyForm.address}
                    onChange={(event) =>
                      setPropertyForm((current) => ({
                        ...current,
                        address: event.target.value,
                      }))
                    }
                  />
                </Field>
                <Field label="備考">
                  <Textarea
                    rows={3}
                    value={propertyForm.notes}
                    onChange={(event) =>
                      setPropertyForm((current) => ({
                        ...current,
                        notes: event.target.value,
                      }))
                    }
                  />
                </Field>
                <Button type="submit">
                  <Plus size={14} />
                  物件を追加
                </Button>
              </form>
            </CardBody>
          </Card>

          <Card>
            <CardHeader
              title={`物件一覧 (${properties.length}件)`}
              description="詳細画面では号室の登録や案件導線までたどれます。"
            />
            <CardBody className="space-y-3">
              {properties.length === 0 ? (
                <EmptyState
                  title="この管理会社の物件はまだありません"
                  description="上のフォームから最初の物件を追加してください。"
                  action={
                    <div className="flex justify-center text-slate-400">
                      <Building2 size={28} />
                    </div>
                  }
                />
              ) : null}

              {properties.map((property) => (
                <div
                  key={property.id}
                  className="flex flex-col gap-3 rounded-2xl border border-line bg-white px-4 py-4 md:flex-row md:items-start md:justify-between"
                >
                  <div>
                    <p className="font-medium text-slate-900">{property.name}</p>
                    <p className="mt-1 text-sm text-slate-500">
                      {property.address || "住所未設定"}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Link
                      href={`/dashboard/properties/${property.id}`}
                      className="inline-flex items-center gap-2 rounded-xl bg-slate-100 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200"
                    >
                      詳細
                    </Link>
                    <Button
                      type="button"
                      variant="danger"
                      onClick={() => void deleteProperty(property)}
                    >
                      削除
                    </Button>
                  </div>
                </div>
              ))}
            </CardBody>
          </Card>
        </div>
      </DataGrid>
    </div>
  );
}
