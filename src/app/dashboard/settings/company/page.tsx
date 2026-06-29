"use client";

import { useEffect, useRef, useState } from "react";

import {
  Button,
  Card,
  CardBody,
  CardHeader,
  DataGrid,
  Field,
  Input,
  PageHeader,
  Select,
} from "@/components/ui";
import { createClient } from "@/lib/supabase/browser";
import { createSignedUrl, removeFile, uploadFile } from "@/lib/storage";
import type { CompanySettings } from "@/lib/types";

const emptySettings: Partial<CompanySettings> = {
  company_name: "",
  postal_code: "",
  address: "",
  phone: "",
  fax: "",
  email: "",
  representative_name: "",
  default_contact_name: "",
  invoice_registration_number: "",
  bank_name: "",
  bank_branch: "",
  bank_account_type: "普通",
  bank_account_number: "",
  bank_account_holder: "",
  seal_image_path: "",
};

export default function SettingsCompanyPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<Partial<CompanySettings>>(emptySettings);
  const [sealUrl, setSealUrl] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const supabase = createClient();
    const { data } = await supabase
      .from("company_settings")
      .select("*")
      .limit(1)
      .maybeSingle();

    const current = (data ?? emptySettings) as Partial<CompanySettings>;
    setSettings(current);
    setSealUrl(
      current.seal_image_path
        ? await createSignedUrl("seals", current.seal_image_path)
        : null,
    );
    setLoading(false);
  };

  useEffect(() => {
    void load();
  }, []);

  const save = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);

    const supabase = createClient();
    const payload = { ...settings };
    let error;

    if (settings.id) {
      ({ error } = await supabase
        .from("company_settings")
        .update(payload)
        .eq("id", settings.id));
    } else {
      ({ error } = await supabase
        .from("company_settings")
        .insert([payload])
        .select("id")
        .single());
    }

    setSaving(false);

    if (error) {
      alert(`保存失敗: ${error.message}`);
      return;
    }

    void load();
  };

  const onUploadSeal = async (file: File) => {
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const path = `company/${Date.now()}_${safeName}`;
    const { error: uploadError } = await uploadFile(
      "seals",
      path,
      file,
      file.type || "image/png",
    );

    if (uploadError) {
      alert(`印鑑アップロード失敗: ${uploadError.message}`);
      return;
    }

    setSettings((current) => ({
      ...current,
      seal_image_path: path,
    }));
    setSealUrl(await createSignedUrl("seals", path));
  };

  const deleteSeal = async () => {
    if (!settings.seal_image_path) {
      return;
    }

    const { error } = await removeFile("seals", settings.seal_image_path);
    if (error) {
      alert(`印鑑の削除に失敗しました: ${error.message}`);
      return;
    }

    setSettings((current) => ({
      ...current,
      seal_image_path: null,
    }));
    setSealUrl(null);
  };

  if (loading) {
    return <p className="text-sm text-slate-500">読み込み中...</p>;
  }

  return (
    <div>
      <PageHeader
        title="自社情報"
        description="PDF に自動で記載される会社情報、振込先、会社印を管理します。"
      />

      <Card>
        <CardHeader
          title="会社情報と振込先"
          description="請求書や入居者向け帳票に反映される基礎情報"
        />
        <CardBody>
          <form className="space-y-6" onSubmit={save}>
            <DataGrid className="lg:grid-cols-2">
              <Field label="会社名">
                <Input
                  value={settings.company_name ?? ""}
                  onChange={(event) =>
                    setSettings((current) => ({
                      ...current,
                      company_name: event.target.value,
                    }))
                  }
                />
              </Field>
              <Field label="代表者名">
                <Input
                  value={settings.representative_name ?? ""}
                  onChange={(event) =>
                    setSettings((current) => ({
                      ...current,
                      representative_name: event.target.value,
                    }))
                  }
                />
              </Field>
              <Field label="郵便番号">
                <Input
                  value={settings.postal_code ?? ""}
                  onChange={(event) =>
                    setSettings((current) => ({
                      ...current,
                      postal_code: event.target.value,
                    }))
                  }
                />
              </Field>
              <Field label="電話">
                <Input
                  value={settings.phone ?? ""}
                  onChange={(event) =>
                    setSettings((current) => ({
                      ...current,
                      phone: event.target.value,
                    }))
                  }
                />
              </Field>
              <Field label="住所">
                <Input
                  value={settings.address ?? ""}
                  onChange={(event) =>
                    setSettings((current) => ({
                      ...current,
                      address: event.target.value,
                    }))
                  }
                />
              </Field>
              <Field label="メール">
                <Input
                  value={settings.email ?? ""}
                  onChange={(event) =>
                    setSettings((current) => ({
                      ...current,
                      email: event.target.value,
                    }))
                  }
                />
              </Field>
              <Field label="適格請求書発行事業者登録番号（T〜）">
                <Input
                  value={settings.invoice_registration_number ?? ""}
                  onChange={(event) =>
                    setSettings((current) => ({
                      ...current,
                      invoice_registration_number: event.target.value,
                    }))
                  }
                />
              </Field>
              <Field label="デフォルト担当者">
                <Input
                  value={settings.default_contact_name ?? ""}
                  onChange={(event) =>
                    setSettings((current) => ({
                      ...current,
                      default_contact_name: event.target.value,
                    }))
                  }
                />
              </Field>
            </DataGrid>

            <DataGrid className="lg:grid-cols-[1fr_1fr_0.6fr_0.8fr]">
              <Field label="銀行名">
                <Input
                  value={settings.bank_name ?? ""}
                  onChange={(event) =>
                    setSettings((current) => ({
                      ...current,
                      bank_name: event.target.value,
                    }))
                  }
                />
              </Field>
              <Field label="支店名">
                <Input
                  value={settings.bank_branch ?? ""}
                  onChange={(event) =>
                    setSettings((current) => ({
                      ...current,
                      bank_branch: event.target.value,
                    }))
                  }
                />
              </Field>
              <Field label="口座種別">
                <Select
                  value={settings.bank_account_type ?? "普通"}
                  onChange={(event) =>
                    setSettings((current) => ({
                      ...current,
                      bank_account_type: event.target.value,
                    }))
                  }
                >
                  <option value="普通">普通</option>
                  <option value="当座">当座</option>
                </Select>
              </Field>
              <Field label="口座番号">
                <Input
                  value={settings.bank_account_number ?? ""}
                  onChange={(event) =>
                    setSettings((current) => ({
                      ...current,
                      bank_account_number: event.target.value,
                    }))
                  }
                />
              </Field>
            </DataGrid>

            <Field label="口座名義人">
              <Input
                value={settings.bank_account_holder ?? ""}
                onChange={(event) =>
                  setSettings((current) => ({
                    ...current,
                    bank_account_holder: event.target.value,
                  }))
                }
              />
            </Field>

            <Card className="overflow-hidden border-dashed">
              <CardHeader
                title="会社印（PDF に自動押印）"
                description="推奨: 背景透明 PNG、200x200 前後。"
              />
              <CardBody className="space-y-4">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="hidden"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) {
                      void onUploadSeal(file);
                    }
                    event.target.value = "";
                  }}
                />
                {sealUrl ? (
                  <img
                    src={sealUrl}
                    alt="会社印"
                    className="h-28 w-28 rounded-2xl border border-line bg-white object-contain p-2"
                  />
                ) : (
                  <div className="flex h-28 w-28 items-center justify-center rounded-2xl border border-dashed border-line bg-white text-xs text-slate-400">
                    印鑑なし
                  </div>
                )}
                <div className="flex flex-wrap gap-3">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    印鑑画像をアップロード
                  </Button>
                  {settings.seal_image_path ? (
                    <Button type="button" variant="danger" onClick={() => void deleteSeal()}>
                      印鑑画像を削除
                    </Button>
                  ) : null}
                </div>
              </CardBody>
            </Card>

            <Button type="submit" disabled={saving}>
              {saving ? "保存中..." : "保存"}
            </Button>
          </form>
        </CardBody>
      </Card>
    </div>
  );
}
