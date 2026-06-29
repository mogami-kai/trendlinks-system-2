"use client";

import Link from "next/link";
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
import type { ManagementCompany, Property, Room } from "@/lib/types";

export default function PropertiesPage() {
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [properties, setProperties] = useState<Property[]>([]);
  const [companies, setCompanies] = useState<Record<string, ManagementCompany>>({});
  const [roomCounts, setRoomCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const supabase = createClient();
      const [{ data: propertiesData }, { data: companiesData }, { data: roomsData }] =
        await Promise.all([
          supabase.from("properties").select("*").order("name"),
          supabase.from("management_companies").select("*"),
          supabase.from("rooms").select("id, property_id"),
        ]);

      setProperties((propertiesData ?? []) as Property[]);
      setCompanies(
        ((companiesData ?? []) as ManagementCompany[]).reduce<
          Record<string, ManagementCompany>
        >((acc, item) => {
          acc[item.id] = item;
          return acc;
        }, {}),
      );
      setRoomCounts(
        ((roomsData ?? []) as Pick<Room, "property_id">[]).reduce<
          Record<string, number>
        >((acc, item) => {
          acc[item.property_id] = (acc[item.property_id] ?? 0) + 1;
          return acc;
        }, {}),
      );
      setLoading(false);
    };

    void load();
  }, []);

  const filtered = properties.filter((property) => {
    const company = companies[property.management_company_id];
    const haystack = `${property.name} ${property.address ?? ""} ${company?.name ?? ""}`;
    return haystack.toLowerCase().includes(query.toLowerCase());
  });

  return (
    <div>
      <PageHeader
        title="物件一覧"
        description="全管理会社の物件を横断表示します。号室や案件は各物件の詳細画面から辿ります。"
      />

      <Card>
        <CardHeader
          title="横断検索"
          description="物件名・住所・管理会社名で検索"
        />
        <CardBody className="space-y-4">
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="物件名・住所・管理会社名で検索..."
          />

          {loading ? <p className="text-sm text-slate-500">読み込み中...</p> : null}
          {!loading && filtered.length === 0 ? (
            <EmptyState
              title="該当する物件がありません"
              description="検索条件を変更するか、管理会社の詳細画面から新しい物件を登録してください。"
            />
          ) : null}

          {!loading && filtered.length > 0 ? (
            <TableWrap>
              <table className="min-w-full text-sm">
                <thead className="border-b border-line bg-panel-strong/70 text-left text-slate-500">
                  <tr>
                    <th className="px-4 py-3">物件</th>
                    <th className="px-4 py-3">管理会社</th>
                    <th className="px-4 py-3">号室</th>
                    <th className="px-4 py-3 text-right">遷移</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((property) => (
                    <tr key={property.id} className="border-b border-line/70">
                      <td className="px-4 py-3">
                        <p className="font-medium text-slate-900">{property.name}</p>
                        <p className="mt-1 text-xs text-slate-500">
                          {property.address || "住所未設定"}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {companies[property.management_company_id]?.name ?? "管理会社なし"}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {roomCounts[property.id] ?? 0}件
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link
                          href={`/dashboard/properties/${property.id}`}
                          className="inline-flex items-center rounded-xl bg-slate-100 px-3 py-2 font-medium text-slate-700 hover:bg-slate-200"
                        >
                          詳細
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
  );
}
