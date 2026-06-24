"use client";

import Link from "next/link";
import { ArrowLeft, Camera, Plus } from "lucide-react";
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
import type { ManagementCompany, Property, Room } from "@/lib/types";

const emptyRoom = {
  room_number: "",
  layout: "",
  area: "",
  notes: "",
};

export default function PropertyDetailPage() {
  const params = useParams<{ id: string }>();
  const propertyId = params.id;

  const [property, setProperty] = useState<Property | null>(null);
  const [company, setCompany] = useState<ManagementCompany | null>(null);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [form, setForm] = useState<Partial<Property>>({});
  const [roomForm, setRoomForm] = useState(emptyRoom);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const supabase = createClient();
    const { data: propertyData } = await supabase
      .from("properties")
      .select("*")
      .eq("id", propertyId)
      .single();

    const currentProperty = (propertyData ?? null) as Property | null;
    setProperty(currentProperty);
    setForm(currentProperty ?? {});

    if (currentProperty?.management_company_id) {
      const { data: companyData } = await supabase
        .from("management_companies")
        .select("*")
        .eq("id", currentProperty.management_company_id)
        .single();
      setCompany((companyData ?? null) as ManagementCompany | null);
    }

    const { data: roomData } = await supabase
      .from("rooms")
      .select("*")
      .eq("property_id", propertyId)
      .order("room_number");

    setRooms((roomData ?? []) as Room[]);
    setLoading(false);
  };

  useEffect(() => {
    void load();
  }, [propertyId]);

  const saveProperty = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const supabase = createClient();
    const { error } = await supabase.from("properties").update(form).eq("id", propertyId);

    if (error) {
      alert(`更新失敗: ${error.message}`);
      return;
    }

    void load();
  };

  const addRoom = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const supabase = createClient();
    const { error } = await supabase.from("rooms").insert([
      {
        property_id: propertyId,
        room_number: roomForm.room_number.trim(),
        layout: roomForm.layout || null,
        area: roomForm.area ? Number(roomForm.area) : null,
        notes: roomForm.notes || null,
      },
    ]);

    if (error) {
      alert(`登録失敗: ${error.message}`);
      return;
    }

    setRoomForm(emptyRoom);
    void load();
  };

  const deleteRoom = async (room: Room) => {
    if (!window.confirm(`号室 ${room.room_number} を削除しますか？`)) {
      return;
    }

    const supabase = createClient();
    const { error } = await supabase.from("rooms").delete().eq("id", room.id);

    if (error) {
      alert(`削除に失敗しました: ${error.message}`);
      return;
    }

    void load();
  };

  if (loading) {
    return <p className="text-sm text-slate-500">読み込み中...</p>;
  }

  if (!property) {
    return <p className="text-sm text-slate-500">物件が見つかりません。</p>;
  }

  return (
    <div>
      <PageHeader
        title={property.name}
        description="物件情報を更新し、案件の起点になる号室を登録します。"
        action={
          <Link
            href="/dashboard/properties"
            className="inline-flex items-center gap-2 rounded-xl border border-line bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-panel-strong"
          >
            <ArrowLeft size={14} />
            物件一覧
          </Link>
        }
      />

      <DataGrid className="xl:grid-cols-[0.95fr_1.05fr]">
        <Card>
          <CardHeader
            title="物件情報"
            description={`${company?.name ?? "管理会社なし"} 配下の物件`}
          />
          <CardBody>
            <form className="space-y-4" onSubmit={saveProperty}>
              <Field label="物件名">
                <Input
                  value={form.name ?? ""}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, name: event.target.value }))
                  }
                />
              </Field>
              <Field label="住所">
                <Input
                  value={form.address ?? ""}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      address: event.target.value,
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

        <div className="space-y-6">
          <Card>
            <CardHeader
              title="号室を追加"
              description="写真管理、案件作成、帳票導線の基点になる号室を登録"
            />
            <CardBody>
              <form className="space-y-4" onSubmit={addRoom}>
                <div className="grid gap-4 md:grid-cols-2">
                  <Field label="号室 *">
                    <Input
                      value={roomForm.room_number}
                      onChange={(event) =>
                        setRoomForm((current) => ({
                          ...current,
                          room_number: event.target.value,
                        }))
                      }
                      required
                    />
                  </Field>
                  <Field label="間取り">
                    <Input
                      value={roomForm.layout}
                      onChange={(event) =>
                        setRoomForm((current) => ({
                          ...current,
                          layout: event.target.value,
                        }))
                      }
                    />
                  </Field>
                </div>
                <Field label="面積">
                  <Input
                    type="number"
                    inputMode="decimal"
                    min="0"
                    step="0.1"
                    value={roomForm.area}
                    onChange={(event) =>
                      setRoomForm((current) => ({
                        ...current,
                        area: event.target.value,
                      }))
                    }
                  />
                </Field>
                <Field label="備考">
                  <Textarea
                    rows={3}
                    value={roomForm.notes}
                    onChange={(event) =>
                      setRoomForm((current) => ({
                        ...current,
                        notes: event.target.value,
                      }))
                    }
                  />
                </Field>
                <Button type="submit">
                  <Plus size={14} />
                  号室を追加
                </Button>
              </form>
            </CardBody>
          </Card>

          <Card>
            <CardHeader
              title={`号室一覧 (${rooms.length}件)`}
              description="各号室から写真管理と案件作成に進めます。"
            />
            <CardBody className="space-y-3">
              {rooms.length === 0 ? (
                <EmptyState
                  title="号室がまだ登録されていません"
                  description="まずは工事対象になる号室を登録してください。"
                />
              ) : null}

              {rooms.map((room) => (
                <div
                  key={room.id}
                  className="flex flex-col gap-3 rounded-2xl border border-line bg-white px-4 py-4 md:flex-row md:items-center md:justify-between"
                >
                  <div>
                    <p className="font-medium text-slate-900">{room.room_number}</p>
                    <p className="mt-1 text-sm text-slate-500">
                      {room.layout || "-"} / {room.area ?? "-"}㎡
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Link
                      href={`/dashboard/rooms/${room.id}/photos`}
                      className="inline-flex items-center gap-2 rounded-xl bg-slate-100 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200"
                    >
                      <Camera size={14} />
                      写真
                    </Link>
                    <Button
                      type="button"
                      variant="danger"
                      onClick={() => void deleteRoom(room)}
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
