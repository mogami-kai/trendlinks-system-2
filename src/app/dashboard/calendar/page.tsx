"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { clsx } from "clsx";

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

const TYPE_STYLES: Record<EventRow["type"], { chip: string; dot: string }> = {
  立ち会い: {
    chip: "border-slate-200 bg-slate-100 text-slate-700",
    dot: "bg-slate-500",
  },
  施工開始: {
    chip: "border-amber-200 bg-amber-50 text-amber-800",
    dot: "bg-amber-500",
  },
  完工予定: {
    chip: "border-emerald-200 bg-emerald-50 text-emerald-700",
    dot: "bg-emerald-600",
  },
};

const WEEKDAYS = ["日", "月", "火", "水", "木", "金", "土"];

const dayKey = (year: number, month: number, day: number) =>
  `${year}-${month}-${day}`;

export default function CalendarPage() {
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<EventRow[]>([]);
  const [toggles, setToggles] = useState({
    inspection: true,
    start: true,
    end: true,
  });
  const [viewDate, setViewDate] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
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

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const eventsByDay = useMemo(() => {
    const map = new Map<string, EventRow[]>();
    for (const event of filtered) {
      const date = new Date(event.at);
      const key = dayKey(date.getFullYear(), date.getMonth(), date.getDate());
      const list = map.get(key);
      if (list) {
        list.push(event);
      } else {
        map.set(key, [event]);
      }
    }
    return map;
  }, [filtered]);

  const cells = useMemo(() => {
    const firstWeekday = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const list: (number | null)[] = [];
    for (let i = 0; i < firstWeekday; i += 1) {
      list.push(null);
    }
    for (let day = 1; day <= daysInMonth; day += 1) {
      list.push(day);
    }
    while (list.length % 7 !== 0) {
      list.push(null);
    }
    return list;
  }, [year, month]);

  const today = new Date();
  const isToday = (day: number) =>
    today.getFullYear() === year &&
    today.getMonth() === month &&
    today.getDate() === day;

  const shiftMonth = (delta: number) => {
    setViewDate(new Date(year, month + delta, 1));
  };

  const goToday = () => {
    const now = new Date();
    setViewDate(new Date(now.getFullYear(), now.getMonth(), 1));
  };

  return (
    <div>
      <PageHeader
        title="カレンダー"
        description="立ち会い予定・施工開始・完工予定をカレンダーと一覧で確認できます。イベントをクリックすると案件詳細に移動できます。"
      />

      <div className="space-y-6">
        <Card>
          <CardHeader
            title={`${year}年${month + 1}月`}
            description="月を切り替えて予定を確認できます。"
            action={
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  aria-label="前の月"
                  onClick={() => shiftMonth(-1)}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-line bg-white text-slate-600 hover:border-line-strong hover:text-slate-900 active:translate-y-px"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  type="button"
                  onClick={goToday}
                  className="inline-flex h-9 items-center justify-center rounded-xl border border-line bg-white px-3 text-sm font-medium text-slate-600 hover:border-line-strong hover:text-slate-900 active:translate-y-px"
                >
                  今日
                </button>
                <button
                  type="button"
                  aria-label="次の月"
                  onClick={() => shiftMonth(1)}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-line bg-white text-slate-600 hover:border-line-strong hover:text-slate-900 active:translate-y-px"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            }
          />
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

            <div className="grid grid-cols-7 gap-px overflow-hidden rounded-2xl border border-line bg-line">
              {WEEKDAYS.map((weekday, index) => (
                <div
                  key={weekday}
                  className={clsx(
                    "bg-panel-strong py-2 text-center text-xs font-medium",
                    index === 0
                      ? "text-red-600"
                      : index === 6
                        ? "text-blue-600"
                        : "text-slate-500",
                  )}
                >
                  {weekday}
                </div>
              ))}

              {cells.map((day, index) => {
                if (day === null) {
                  return (
                    <div
                      key={`empty-${index}`}
                      className="min-h-[84px] bg-white/55 md:min-h-[120px]"
                    />
                  );
                }

                const weekday = index % 7;
                const dayEvents = eventsByDay.get(dayKey(year, month, day)) ?? [];

                return (
                  <div
                    key={day}
                    className="min-h-[84px] bg-white p-1.5 md:min-h-[120px] md:p-2"
                  >
                    <span
                      className={clsx(
                        "tnum inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold",
                        isToday(day)
                          ? "bg-brand text-white"
                          : weekday === 0
                            ? "text-red-600"
                            : weekday === 6
                              ? "text-blue-600"
                              : "text-slate-600",
                      )}
                    >
                      {day}
                    </span>

                    <div className="mt-1 space-y-1">
                      {dayEvents.slice(0, 3).map((event) => (
                        <Link
                          key={event.id}
                          href={`/dashboard/jobs/${event.jobId}`}
                          title={`${event.title}／${event.type}`}
                          className={clsx(
                            "block truncate rounded-md border px-1.5 py-0.5 text-[11px] leading-tight hover:opacity-80",
                            TYPE_STYLES[event.type].chip,
                          )}
                        >
                          {event.title}
                        </Link>
                      ))}
                      {dayEvents.length > 3 ? (
                        <p className="px-1 text-[10px] text-slate-400">
                          ＋{dayEvents.length - 3}件
                        </p>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-500">
              {(Object.keys(TYPE_STYLES) as EventRow["type"][]).map((type) => (
                <span key={type} className="inline-flex items-center gap-1.5">
                  <span
                    className={clsx(
                      "h-2.5 w-2.5 rounded-full",
                      TYPE_STYLES[type].dot,
                    )}
                  />
                  {type}
                </span>
              ))}
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            title="予定リスト"
            description="日付順の一覧です。表示するイベントは上の絞り込みと連動します。"
          />
          <CardBody className="space-y-4">
            {loading ? (
              <p className="text-sm text-slate-500">読み込み中...</p>
            ) : null}
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
                      <p className="text-sm font-medium text-slate-800">
                        {event.type}
                      </p>
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
    </div>
  );
}
