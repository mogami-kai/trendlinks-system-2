"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { jobStatusOptions } from "@/lib/app";
import {
  Badge,
  Button,
  Card,
  CardBody,
  CardHeader,
  EmptyState,
  Input,
  LinkButton,
  PageHeader,
  Select,
  TableWrap,
} from "@/components/ui";
import { createClient } from "@/lib/supabase/browser";
import { formatDate, getStatusLabel } from "@/lib/format";
import type { Job, JobStatus } from "@/lib/types";

type JobRow = Job & {
  rooms?: {
    room_number: string;
    properties?: {
      name: string;
      management_companies?: { name: string };
    };
  } | null;
};

export default function JobsPage() {
  const [loading, setLoading] = useState(true);
  const [jobs, setJobs] = useState<JobRow[]>([]);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const load = async () => {
    setLoading(true);
    const supabase = createClient();
    const { data } = await supabase
      .from("jobs")
      .select(
        "*, rooms(room_number, properties(name, management_companies(name)))",
      )
      .order("created_at", { ascending: false });

    setJobs((data ?? []) as JobRow[]);
    setLoading(false);
  };

  useEffect(() => {
    void load();
  }, []);

  const filtered = jobs.filter((job) => {
    const haystack = `${job.title} ${job.rooms?.room_number ?? ""} ${
      job.rooms?.properties?.name ?? ""
    } ${job.tenant_name ?? ""}`.toLowerCase();
    const matchesQuery = haystack.includes(query.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || job.status === (statusFilter as JobStatus);
    return matchesQuery && matchesStatus;
  });

  const removeJob = async (job: JobRow) => {
    if (!window.confirm(`「${job.title}」を削除しますか？`)) {
      return;
    }

    const supabase = createClient();
    const { error } = await supabase.from("jobs").delete().eq("id", job.id);
    if (error) {
      alert(`削除失敗: ${error.message}`);
      return;
    }

    void load();
  };

  return (
    <div>
      <PageHeader
        title="案件"
        description="原状回復の案件管理。号室ごとに 1 件ずつ作成し、立会から入金までの状態を追跡します。"
        action={<LinkButton href="/dashboard/jobs/new">新規案件</LinkButton>}
      />

      <Card>
        <CardHeader title="案件一覧" description="検索、ステータス絞り込み、詳細画面への遷移" />
        <CardBody className="space-y-4">
          <div className="grid gap-3 md:grid-cols-[1fr_220px]">
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="物件名・号室・賃借人名で検索..."
            />
            <Select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
            >
              <option value="all">すべて</option>
              {jobStatusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </div>

          {loading ? <p className="text-sm text-slate-500">読み込み中...</p> : null}
          {!loading && filtered.length === 0 ? (
            <EmptyState
              title="案件がまだありません"
              description="右上の「新規案件」から最初の案件を登録しましょう。"
            />
          ) : null}

          {!loading && filtered.length > 0 ? (
            <TableWrap>
              <table className="min-w-full text-sm">
                <thead className="border-b border-line bg-panel-strong/70 text-left text-slate-500">
                  <tr>
                    <th className="px-4 py-3">案件</th>
                    <th className="px-4 py-3">物件 / 号室</th>
                    <th className="px-4 py-3">退去 / 立会</th>
                    <th className="px-4 py-3">状態</th>
                    <th className="px-4 py-3 text-right">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((job) => {
                    const statusInfo = jobStatusOptions.find(
                      (option) => option.value === job.status,
                    );

                    return (
                      <tr key={job.id} className="border-b border-line/70">
                        <td className="px-4 py-3">
                          <p className="font-medium text-slate-900">{job.title}</p>
                          <p className="mt-1 text-xs text-slate-500">
                            賃借人 {job.tenant_name || "-"}
                          </p>
                        </td>
                        <td className="px-4 py-3 text-slate-600">
                          <p>{job.rooms?.properties?.name ?? "物件未設定"}</p>
                          <p className="mt-1 text-xs text-slate-500">
                            {job.rooms?.room_number ?? "-"}
                          </p>
                        </td>
                        <td className="px-4 py-3 text-slate-600">
                          <p>解約 {formatDate(job.move_out_date)}</p>
                          <p className="mt-1 text-xs text-slate-500">
                            立会 {formatDate(job.inspection_date)}
                          </p>
                        </td>
                        <td className="px-4 py-3">
                          <Badge className={statusInfo?.classes}>
                            {getStatusLabel(job.status)}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-2">
                            <Link
                              href={`/dashboard/jobs/${job.id}`}
                              className="inline-flex items-center rounded-xl bg-slate-100 px-3 py-2 font-medium text-slate-700 hover:bg-slate-200"
                            >
                              詳細
                            </Link>
                            <Button
                              type="button"
                              variant="danger"
                              onClick={() => void removeJob(job)}
                            >
                              削除
                            </Button>
                          </div>
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
