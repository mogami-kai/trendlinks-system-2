"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import {
  Card,
  CardBody,
  CardHeader,
  EmptyState,
  PageHeader,
} from "@/components/ui";
import { createClient } from "@/lib/supabase/browser";
import { formatDate, formatDateTime, getStatusLabel } from "@/lib/format";
import type { Job } from "@/lib/types";

type EventRow = {
  id: string;
  jobId: string;
  title: string;
  type: "立ち会い" | "施工開始" | "完工予定";
  at: string;
  status: string;
};

type CalendarJob = Job & {
  rooms?: {
    room_number: string;
    properties?: { name: string };
  } | null;
};

export default function CalendarPage() {
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<EventRow[]>([]);
  const [toggles, setToggles] = useState({
    inspection: true,
    start: true,
    end: true,
  });

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const supabase = createClient();
      const { data } = await supabase
        .from("jobs")
        .select("*, rooms(room_number, properties(name))")
        .order("inspection_date", { ascending: true, nullsFirst: false });

      const rows = ((data ?? []) as CalendarJob[]).flatMap((job) => {
        const label = `${job.rooms?.properties?.name ?? "物件未設定"} ${
          job.rooms?.room_number ?? ""
        }`;
        const items: EventRow[] = [];

        if (job.inspection_date) {
          items.push({
            id: `${job.id}-inspection`,
            jobId: job.id,
            title: label,
            type: "立ち会い",
            at: job.inspection_date,
            status: job.status,
          });
        }
        if (job.work_start_date) {
          items.push({
            id: `${job.id}-start`,
            jobId: job.id,
            title: label,
            type: "施工開始",
            at: job.work_start_date,
            status: job.status,
          });
        }
        if (job.work_end_date) {
          items.push({
            id: `${job.id}-end`,
            jobId: job.id,
            title: label,
            type: "完工予定",
            at: job.work_end_date,
            status: job.status,
          });
        }

        return items;
      });

      rows.sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime());
      setEvents(rows);
      setLoading(false);
    };

    void load();
  }, []);

  const filtered = events.filter((event) => {
    if (event.type === "立ち会い") {
      return toggles.inspection;
    }
    if (event.type === "施工開始") {
      return toggles.start;
    }
    return toggles.end;
  });

  return (
    <div>
      <PageHeader
        title="カレンダー"
        description="立ち会い予定・施工開始・完工予定を一覧表示します。イベントクリックで案件詳細に移動できます。"
      />

      <Card>
        <CardHeader title="予定リスト" description="表示するイベントを切り替えられます。" />
        <CardBody className="space-y-4">
          <div className="flex flex-wrap gap-2 text-sm">
            <label className="inline-flex items-center gap-2 rounded-full border border-line bg-white px-3 py-2">
              <input
                type="checkbox"
                checked={toggles.inspection}
                onChange={(event) =>
                  setToggles((current) => ({
                    ...current,
                    inspection: event.target.checked,
                  }))
                }
              />
              立ち会い
            </label>
            <label className="inline-flex items-center gap-2 rounded-full border border-line bg-white px-3 py-2">
              <input
                type="checkbox"
                checked={toggles.start}
                onChange={(event) =>
                  setToggles((current) => ({
                    ...current,
                    start: event.target.checked,
                  }))
                }
              />
              施工開始
            </label>
            <label className="inline-flex items-center gap-2 rounded-full border border-line bg-white px-3 py-2">
              <input
                type="checkbox"
                checked={toggles.end}
                onChange={(event) =>
                  setToggles((current) => ({
                    ...current,
                    end: event.target.checked,
                  }))
                }
              />
              完工予定
            </label>
          </div>

          {loading ? <p className="text-sm text-slate-500">読み込み中...</p> : null}
          {!loading && filtered.length === 0 ? (
            <EmptyState
              title="表示する予定はありません"
              description="対象期間内の立会・施工開始・完工予定が登録されるとここに並びます。"
            />
          ) : null}

          <div className="space-y-3">
            {filtered.map((event) => (
              <Link
                key={event.id}
                href={`/dashboard/jobs/${event.jobId}`}
                className="block rounded-2xl border border-line bg-white px-4 py-4 hover:border-slate-400"
              >
                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="font-medium text-slate-900">{event.title}</p>
                    <p className="mt-1 text-sm text-slate-500">
                      {event.type === "立ち会い"
                        ? formatDateTime(event.at)
                        : formatDate(event.at)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-slate-800">{event.type}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      {getStatusLabel(event.status)}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
