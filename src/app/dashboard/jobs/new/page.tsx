"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { jobStatusOptions, jobTypeOptions } from "@/lib/app";
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Field,
  Input,
  PageHeader,
  Select,
  Textarea,
} from "@/components/ui";
import { createClient } from "@/lib/supabase/browser";
import type { ManagementCompany, Property, Room } from "@/lib/types";

const generateJobNumber = () => {
  const now = new Date();
  const stamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(
    2,
    "0",
  )}${String(now.getDate()).padStart(2, "0")}`;
  const random = String(Math.floor(Math.random() * 1000)).padStart(3, "0");
  return `J${stamp}${random}`;
};

export default function NewJobPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [companies, setCompanies] = useState<ManagementCompany[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [form, setForm] = useState({
    management_company_id: "",
    property_id: "",
    room_id: "",
    job_number: "",
    status: "move_out_received",
    job_type: "原状回復工事",
    title: "",
    tenant_name: "",
    contract_date: "",
    move_out_date: "",
    deposit_amount: "",
    prepaid_amount: "",
    inspection_date: "",
    inspector_name: "",
    key_location: "",
    autolock_release: "",
    notes: "",
  });

  useEffect(() => {
    const load = async () => {
      const supabase = createClient();
      const [{ data: companiesData }, { data: propertiesData }, { data: roomsData }] =
        await Promise.all([
          supabase.from("management_companies").select("*").order("name"),
          supabase.from("properties").select("*").order("name"),
          supabase.from("rooms").select("*").order("room_number"),
        ]);

        setCompanies((companiesData ?? []) as ManagementCompany[]);
        setProperties((propertiesData ?? []) as Property[]);
        setRooms((roomsData ?? []) as Room[]);
      };

    void load();
  }, []);

  const visibleProperties = properties.filter(
    (property) => property.management_company_id === form.management_company_id,
  );
  const visibleRooms = rooms.filter((room) => room.property_id === form.property_id);
  const selectedProperty = properties.find((property) => property.id === form.property_id);
  const selectedRoom = rooms.find((room) => room.id === form.room_id);

  const defaultTitle = useMemo(() => {
    if (!selectedProperty || !selectedRoom) {
      return "";
    }

    return `${selectedProperty.name} ${selectedRoom.room_number} ${
      form.job_type || "原状回復工事"
    }`;
  }, [form.job_type, selectedProperty, selectedRoom]);

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);

    const supabase = createClient();
    const title = form.title.trim() || defaultTitle;
    const { data, error } = await supabase
      .from("jobs")
      .insert([
        {
          room_id: form.room_id,
          management_company_id: form.management_company_id,
          job_number: form.job_number.trim() || generateJobNumber(),
          title,
          status: form.status,
          job_type: form.job_type,
          tenant_name: form.tenant_name || null,
          contract_date: form.contract_date || null,
          move_out_date: form.move_out_date || null,
          deposit_amount: form.deposit_amount ? Number(form.deposit_amount) : null,
          prepaid_amount: form.prepaid_amount ? Number(form.prepaid_amount) : null,
          inspection_date: form.inspection_date
            ? new Date(form.inspection_date).toISOString()
            : null,
          inspector_name: form.inspector_name || null,
          key_location: form.key_location || null,
          autolock_release: form.autolock_release || null,
          notes: form.notes || null,
        },
      ])
      .select("id")
      .single();

    setSaving(false);

    if (error || !data) {
      alert(`登録失敗: ${error?.message ?? "unknown error"}`);
      return;
    }

    router.replace(`/dashboard/jobs/${data.id}`);
    router.refresh();
  };

  return (
    <div>
      <PageHeader
        title="新規案件"
        description="物件・号室を起点に、入居者情報、立会情報、工事種別をまとめて起票します。"
      />

      <Card>
        <CardHeader
          title="案件情報を入力"
          description="空欄の案件名は、物件名と号室から自動補完されます。"
        />
        <CardBody>
          <form className="space-y-6" onSubmit={onSubmit}>
            <div className="grid gap-4 lg:grid-cols-3">
              <Field label="管理会社 *">
                <Select
                  value={form.management_company_id}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      management_company_id: event.target.value,
                      property_id: "",
                      room_id: "",
                    }))
                  }
                  required
                >
                  <option value="">選択してください</option>
                  {companies.map((company) => (
                    <option key={company.id} value={company.id}>
                      {company.name}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="物件 *">
                <Select
                  value={form.property_id}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      property_id: event.target.value,
                      room_id: "",
                    }))
                  }
                  required
                  disabled={!form.management_company_id}
                >
                  <option value="">
                    {form.management_company_id
                      ? "選択してください"
                      : "先に管理会社を選択"}
                  </option>
                  {visibleProperties.map((property) => (
                    <option key={property.id} value={property.id}>
                      {property.name}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="号室 *">
                <Select
                  value={form.room_id}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, room_id: event.target.value }))
                  }
                  required
                  disabled={!form.property_id}
                >
                  <option value="">
                    {form.property_id ? "選択してください" : "先に物件を選択"}
                  </option>
                  {visibleRooms.map((room) => (
                    <option key={room.id} value={room.id}>
                      {room.room_number}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <Field label="案件番号（任意）">
                <Input
                  value={form.job_number}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      job_number: event.target.value,
                    }))
                  }
                  placeholder="空欄なら自動採番"
                />
              </Field>
              <Field label="ステータス">
                <Select
                  value={form.status}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      status: event.target.value,
                    }))
                  }
                >
                  {jobStatusOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="工事種別">
                <Select
                  value={form.job_type}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      job_type: event.target.value,
                    }))
                  }
                >
                  {jobTypeOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="案件名（任意）" hint={`空欄時: ${defaultTitle || "物件・号室選択後に自動生成"}`}>
                <Input
                  value={form.title}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, title: event.target.value }))
                  }
                />
              </Field>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <Field label="賃借人名（任意）">
                <Input
                  value={form.tenant_name}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      tenant_name: event.target.value,
                    }))
                  }
                />
              </Field>
              <Field label="契約日">
                <Input
                  type="date"
                  value={form.contract_date}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      contract_date: event.target.value,
                    }))
                  }
                />
              </Field>
              <Field label="解約日">
                <Input
                  type="date"
                  value={form.move_out_date}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      move_out_date: event.target.value,
                    }))
                  }
                />
              </Field>
              <Field label="敷金（円）">
                <Input
                  type="number"
                  inputMode="numeric"
                  min="0"
                  value={form.deposit_amount}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      deposit_amount: event.target.value,
                    }))
                  }
                />
              </Field>
              <Field label="預り金（円）">
                <Input
                  type="number"
                  inputMode="numeric"
                  min="0"
                  value={form.prepaid_amount}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      prepaid_amount: event.target.value,
                    }))
                  }
                />
              </Field>
              <Field label="立ち会い日時">
                <Input
                  type="datetime-local"
                  value={form.inspection_date}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      inspection_date: event.target.value,
                    }))
                  }
                />
              </Field>
              <Field label="現調担当者">
                <Input
                  value={form.inspector_name}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      inspector_name: event.target.value,
                    }))
                  }
                />
              </Field>
              <Field label="鍵設置場所">
                <Input
                  value={form.key_location}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      key_location: event.target.value,
                    }))
                  }
                />
              </Field>
            </div>

            <Field label="オートロック解除">
              <Input
                value={form.autolock_release}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    autolock_release: event.target.value,
                  }))
                }
              />
            </Field>

            <Field label="備考">
              <Textarea
                rows={5}
                value={form.notes}
                onChange={(event) =>
                  setForm((current) => ({ ...current, notes: event.target.value }))
                }
              />
            </Field>

            <div className="flex flex-wrap gap-3">
              <Button type="submit" disabled={saving}>
                {saving ? "登録中..." : "案件を登録"}
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => router.back()}
              >
                キャンセル
              </Button>
            </div>
          </form>
        </CardBody>
      </Card>
    </div>
  );
}
