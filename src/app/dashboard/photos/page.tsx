"use client";

import Link from "next/link";
import { Camera, Search } from "lucide-react";
import { useEffect, useState } from "react";

import {
  Card,
  CardBody,
  CardHeader,
  EmptyState,
  Input,
  PageHeader,
  TableWrap,
} from "@/components/ui";
import { createClient } from "@/lib/supabase/browser";
import type { ManagementCompany, Photo, Property, Room } from "@/lib/types";

export default function PhotosPage() {
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [rooms, setRooms] = useState<Room[]>([]);
  const [properties, setProperties] = useState<Record<string, Property>>({});
  const [companies, setCompanies] = useState<Record<string, ManagementCompany>>({});
  const [photoCounts, setPhotoCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const supabase = createClient();
      const [{ data: roomData }, { data: propertyData }, { data: companyData }, { data: photoData }] =
        await Promise.all([
          supabase.from("rooms").select("*").order("created_at", { ascending: false }),
          supabase.from("properties").select("*"),
          supabase.from("management_companies").select("*"),
          supabase.from("photos").select("id, room_id"),
        ]);

      setRooms((roomData ?? []) as Room[]);
      setProperties(
        ((propertyData ?? []) as Property[]).reduce<Record<string, Property>>((acc, item) => {
          acc[item.id] = item;
          return acc;
        }, {}),
      );
      setCompanies(
        ((companyData ?? []) as ManagementCompany[]).reduce<
          Record<string, ManagementCompany>
        >((acc, item) => {
          acc[item.id] = item;
          return acc;
        }, {}),
      );
      setPhotoCounts(
        ((photoData ?? []) as Pick<Photo, "room_id">[]).reduce<Record<string, number>>(
          (acc, item) => {
            acc[item.room_id] = (acc[item.room_id] ?? 0) + 1;
            return acc;
          },
          {},
        ),
      );
      setLoading(false);
    };

    void load();
  }, []);

  const filtered = rooms.filter((room) => {
    const property = properties[room.property_id];
    const company = property ? companies[property.management_company_id] : null;
    const haystack = `${company?.name ?? ""} ${property?.name ?? ""} ${
      room.room_number
    }`.toLowerCase();
    return haystack.includes(query.toLowerCase());
  });

  return (
    <div>
      <PageHeader
        title="写真"
        description="号室を選んで写真を見る・アップロードします。"
      />

      <Card>
        <CardHeader title="号室一覧" description="管理会社、物件、号室名で検索" />
        <CardBody className="space-y-4">
          <div className="relative max-w-xl">
            <Search className="pointer-events-none absolute left-3 top-3 text-slate-400" size={16} />
            <Input
              className="pl-9"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="物件名・号室・管理会社で検索..."
            />
          </div>

          {loading ? <p className="text-sm text-slate-500">読み込み中...</p> : null}
          {!loading && filtered.length === 0 ? (
            <EmptyState
              title="該当する号室がありません"
              description="先に「管理会社 → 物件 → 号室」を登録してください。"
            />
          ) : null}

          {!loading && filtered.length > 0 ? (
            <TableWrap>
              <table className="min-w-full text-sm">
                <thead className="border-b border-line bg-panel-strong/70 text-left text-slate-500">
                  <tr>
                    <th className="px-4 py-3">管理会社</th>
                    <th className="px-4 py-3">物件</th>
                    <th className="px-4 py-3">号室</th>
                    <th className="px-4 py-3">写真</th>
                    <th className="px-4 py-3 text-right">移動</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((room) => {
                    const property = properties[room.property_id];
                    const company = property ? companies[property.management_company_id] : null;
                    return (
                      <tr key={room.id} className="border-b border-line/70">
                        <td className="px-4 py-3 text-slate-600">{company?.name ?? "-"}</td>
                        <td className="px-4 py-3 text-slate-600">{property?.name ?? "-"}</td>
                        <td className="px-4 py-3 font-medium text-slate-900">
                          {room.room_number}
                        </td>
                        <td className="px-4 py-3 text-slate-600">
                          {photoCounts[room.id] ?? 0}枚
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Link
                            href={`/dashboard/rooms/${room.id}/photos`}
                            className="inline-flex items-center gap-2 rounded-xl bg-slate-100 px-3 py-2 font-medium text-slate-700 hover:bg-slate-200"
                          >
                            <Camera size={14} />
                            開く
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </TableWrap>
          ) : null}
        </CardBody>
      </Card>
    </div>
  );
}
