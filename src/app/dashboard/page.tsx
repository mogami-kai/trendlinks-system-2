"use client";

import Link from "next/link";
import { CalendarDays, ChevronRight, FolderOpenDot } from "lucide-react";
import { useEffect, useState } from "react";

import {
  Card,
  CardBody,
  CardHeader,
  EmptyState,
  PageHeader,
  StatCard,
} from "@/components/ui";
import { formatDate, formatDateTime, getStatusLabel } from "@/lib/format";
import { createClient } from "@/lib/supabase/browser";
import type { Job } from "@/lib/types";

type DashboardJob = Job & {
  rooms?: {
    room_number: string;
    properties?: { name: string };
  } | null;
};

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [activeCount, setActiveCount] = useState(0);
  const [inspectionCount, setInspectionCount] = useState(0);
  const [completionCount, setCompletionCount] = useState(0);
  const [recentJobs, setRecentJobs] = useState<DashboardJob[]>([]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const supabase = createClient();
      const today = new Date();
      const plus30 = new Date(today);
      plus30.setDate(plus30.getDate() + 30);

      const [{ count }, { data }] = await Promise.all([
        supabase
          .from("jobs")
          .select("*", { count: "exact", head: true })
          .neq("status", "paid"),
        supabase
          .from("jobs")
          .select(
            "*, rooms(room_number, properties(name))",
          )
          .order("inspection_date", { ascending: true, nullsFirst: false })
          .limit(12),
      ]);

      const jobs = ((data ?? []) as DashboardJob[]).filter(Boolean);
      setActiveCount(count ?? 0);

      const upcoming = jobs.filter(
        (job) =>
          job.inspection_date &&
          new Date(job.inspection_date) >= today &&
          new Date(job.inspection_date) <= plus30,
      );
      const completions = jobs.filter(
        (job) =>
          job.work_end_date &&
          new Date(job.work_end_date) >= today &&
          new Date(job.work_end_date) <= plus30,
      );

      setInspectionCount(upcoming.length);
      setCompletionCount(completions.length);
      setRecentJobs(jobs);
      setLoading(false);
    };

    void load();
  }, []);

  return (
    <div>
      <PageHeader
        title="ダッシュボード"
        description="原状回復案件の進行状況と、直近 30 日の立会・完工予定をまとめて確認します。"
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <StatCard
          label="進行中の案件"
          value={loading ? "…" : `${activeCount}件`}
          sublabel="入金済みを除いたアクティブ案件"
        />
        <StatCard
          label="直近の立会"
          value={loading ? "…" : `${inspectionCount}件`}
          sublabel="30 日以内に予定されている立会"
        />
        <StatCard
          label="直近の完工予定"
          value={loading ? "…" : `${completionCount}件`}
          sublabel="30 日以内に予定されている完工"
        />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <Card>
          <CardHeader
            title="進行中の案件"
            description="立会、見積、施工、請求までの現在地を一覧化"
            action={
              <Link
                href="/dashboard/jobs"
                className="inline-flex items-center gap-2 text-sm font-medium text-slate-700 hover:text-slate-900"
              >
                すべて見る
                <ChevronRight size={16} />
              </Link>
            }
          />
          <CardBody className="space-y-3">
            {!loading && recentJobs.length === 0 ? (
              <EmptyState
                title="進行中の案件はありません"
                description="案件を登録すると、ここに最近の進行状況が表示されます。"
              />
            ) : null}

            {recentJobs.slice(0, 8).map((job) => (
              <Link
                key={job.id}
                href={`/dashboard/jobs/${job.id}`}
                className="flex items-center justify-between gap-4 rounded-2xl border border-line bg-white px-4 py-3 hover:border-slate-400"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium text-slate-900">
                    {job.title}
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    {job.rooms?.properties?.name ?? "物件未設定"} /{" "}
                    {job.rooms?.room_number ?? "-"}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-slate-800">
                    {getStatusLabel(job.status)}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    立会 {formatDateTime(job.inspection_date)}
                  </p>
                </div>
              </Link>
            ))}
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            title="直近の予定"
            description="立会予定と完工予定の近い順"
            action={
              <Link
                href="/dashboard/calendar"
                className="inline-flex items-center gap-2 text-sm font-medium text-slate-700 hover:text-slate-900"
              >
                <CalendarDays size={16} />
                カレンダー
              </Link>
            }
          />
          <CardBody className="space-y-3">
            {!loading &&
            recentJobs.filter((job) => job.inspection_date || job.work_end_date)
              .length === 0 ? (
              <EmptyState
                title="直近の予定はありません"
                description="立会日時や完工日が入ると、ここに予定が並びます。"
              />
            ) : null}

            {recentJobs
              .filter((job) => job.inspection_date || job.work_end_date)
              .slice(0, 8)
              .map((job) => (
                <Link
                  key={job.id}
                  href={`/dashboard/jobs/${job.id}`}
                  className="flex items-start gap-3 rounded-2xl bg-panel-strong/60 px-4 py-3 hover:bg-panel-strong"
                >
                  <div className="mt-0.5 rounded-xl bg-white p-2 text-slate-700 shadow-sm">
                    <FolderOpenDot size={16} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-slate-900">
                      {job.title}
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      立会 {formatDateTime(job.inspection_date)} / 完工{" "}
                      {formatDate(job.work_end_date)}
                    </p>
                  </div>
                </Link>
              ))}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
