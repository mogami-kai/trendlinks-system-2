"use client";

import Link from "next/link";
import { ArrowLeft, FileUp, ImageIcon, Plus } from "lucide-react";
import { useParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { jobStatusOptions, jobTypeOptions } from "@/lib/app";
import {
  Badge,
  Button,
  Card,
  CardBody,
  CardHeader,
  DataGrid,
  EmptyState,
  Field,
  Input,
  PageHeader,
  Select,
  TableWrap,
  Textarea,
} from "@/components/ui";
import { QuoteForm } from "@/components/quote-form";
import { TenantInvoiceForm } from "@/components/tenant-invoice-form";
import { createClient } from "@/lib/supabase/browser";
import { formatCurrency, formatDate, formatDateTime, getStatusLabel } from "@/lib/format";
import { createSignedUrlMap, removeFile, uploadFile } from "@/lib/storage";
import type {
  CompanySettings,
  InspectionReport,
  Job,
  JobDocument,
  Quote,
  TenantInvoice,
  WorkOrder,
} from "@/lib/types";

type JobDetail = Job & {
  rooms?: {
    id: string;
    room_number: string;
    layout: string | null;
    area: number | null;
    properties?: {
      id: string;
      name: string;
      address: string | null;
      management_companies?: { id: string; name: string } | null;
    } | null;
  } | null;
};

type WorkOrderRow = WorkOrder & { contractors?: { name: string } | null };
type DocumentListItem = {
  id: string;
  label: string;
  total: number | null;
  issueDate: string | null;
  path: string | null;
  meta?: string | null;
  signedUrl?: string | null;
};

type JobDocumentWithUrl = JobDocument & {
  signedUrl?: string | null;
};

export default function JobDetailPage() {
  const params = useParams<{ id: string }>();
  const jobId = params.id;
  const uploadRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [job, setJob] = useState<JobDetail | null>(null);
  const [form, setForm] = useState<Partial<Job>>({});
  const [workOrders, setWorkOrders] = useState<WorkOrderRow[]>([]);
  const [quotes, setQuotes] = useState<DocumentListItem[]>([]);
  const [tenantInvoices, setTenantInvoices] = useState<DocumentListItem[]>([]);
  const [inspectionReports, setInspectionReports] = useState<DocumentListItem[]>([]);
  const [documents, setDocuments] = useState<JobDocumentWithUrl[]>([]);
  const [docType, setDocType] = useState("その他");
  const [companySettings, setCompanySettings] = useState<CompanySettings | null>(null);
  const [showQuoteForm, setShowQuoteForm] = useState(false);
  const [showInvoiceForm, setShowInvoiceForm] = useState(false);
  const [editingQuote, setEditingQuote] = useState<Quote | null>(null);
  const [editingInvoice, setEditingInvoice] = useState<TenantInvoice | null>(null);
  const [quotesRaw, setQuotesRaw] = useState<Quote[]>([]);
  const [invoicesRaw, setInvoicesRaw] = useState<TenantInvoice[]>([]);

  const hydrateSignedUrls = async (
    items: Array<{ id: string; path: string | null }>,
  ) => {
    const map = await createSignedUrlMap(
      "pdfs",
      items.map((item) => item.path ?? "").filter(Boolean),
    );
    return map;
  };

  const load = async () => {
    setLoading(true);
    const supabase = createClient();
    const [
      { data: jobData },
      { data: workOrderData },
      { data: quoteData },
      { data: invoiceData },
      { data: reportData },
      { data: documentData },
      { data: companyData },
    ] = await Promise.all([
      supabase
        .from("jobs")
        .select(
          "*, rooms(id, room_number, layout, area, properties(id, name, address, management_companies(id, name)))",
        )
        .eq("id", jobId)
        .single(),
      supabase
        .from("work_orders")
        .select(
          "id, order_number, issue_date, total, is_provisional, completion_date, pdf_path, fax_sent_at, fax_sent_method, paid_at, contractors(name)",
        )
        .eq("job_id", jobId)
        .order("created_at", { ascending: false }),
      supabase
        .from("quotes")
        .select("id, quote_number, issue_date, total, pdf_path, line_items, notes")
        .eq("job_id", jobId)
        .order("created_at", { ascending: false }),
      supabase
        .from("tenant_invoices")
        .select("id, invoice_number, issue_date, total, pdf_path, tenant_signature, line_items, deposit_offset, notes")
        .eq("job_id", jobId)
        .order("created_at", { ascending: false }),
      supabase
        .from("inspection_reports")
        .select("id, report_number, inspection_date, total, pdf_path, tenant_signature")
        .eq("job_id", jobId)
        .order("created_at", { ascending: false }),
      supabase
        .from("job_documents")
        .select("*")
        .eq("job_id", jobId)
        .order("created_at", { ascending: false }),
      supabase.from("company_settings").select("*").single(),
    ]);

    if (companyData) {
      setCompanySettings(companyData as CompanySettings);
    }

    const currentJob = (jobData ?? null) as JobDetail | null;
    setJob(currentJob);
    setForm(currentJob ?? {});
    setWorkOrders((workOrderData ?? []) as WorkOrderRow[]);

    const quoteMap = await hydrateSignedUrls(
      ((quoteData ?? []) as Quote[]).map((item) => ({
        id: item.id,
        path: item.pdf_path,
      })),
    );
    const invoiceMap = await hydrateSignedUrls(
      ((invoiceData ?? []) as TenantInvoice[]).map((item) => ({
        id: item.id,
        path: item.pdf_path,
      })),
    );
    const reportMap = await hydrateSignedUrls(
      ((reportData ?? []) as InspectionReport[]).map((item) => ({
        id: item.id,
        path: item.pdf_path,
      })),
    );
    const documentMap = await hydrateSignedUrls(
      ((documentData ?? []) as JobDocument[]).map((item) => ({
        id: item.id,
        path: item.file_path,
      })),
    );

    setQuotesRaw((quoteData ?? []) as Quote[]);
    setInvoicesRaw((invoiceData ?? []) as TenantInvoice[]);
    setQuotes(
      ((quoteData ?? []) as Quote[]).map((item) => ({
        id: item.id,
        label: item.quote_number,
        total: item.total,
        issueDate: item.issue_date,
        path: item.pdf_path,
        signedUrl: item.pdf_path ? quoteMap[item.pdf_path] : null,
      })),
    );
    setTenantInvoices(
      ((invoiceData ?? []) as TenantInvoice[]).map((item) => ({
        id: item.id,
        label: item.invoice_number,
        total: item.total,
        issueDate: item.issue_date,
        path: item.pdf_path,
        meta: item.tenant_signature ? "サイン済" : "未サイン",
        signedUrl: item.pdf_path ? invoiceMap[item.pdf_path] : null,
      })),
    );
    setInspectionReports(
      ((reportData ?? []) as InspectionReport[]).map((item) => ({
        id: item.id,
        label: item.report_number,
        total: item.total,
        issueDate: item.inspection_date,
        path: item.pdf_path,
        meta: item.tenant_signature ? "サイン済" : "未サイン",
        signedUrl: item.pdf_path ? reportMap[item.pdf_path] : null,
      })),
    );
    setDocuments(
      ((documentData ?? []) as JobDocument[]).map((item) => ({
        ...item,
        signedUrl: documentMap[item.file_path] ?? null,
      })),
    );
    setLoading(false);
  };

  useEffect(() => {
    void load();
  }, [jobId]);

  const save = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);

    const payload = { ...form };
    delete (payload as { rooms?: unknown }).rooms;
    delete (payload as { created_at?: unknown }).created_at;
    delete (payload as { updated_at?: unknown }).updated_at;

    const supabase = createClient();
    const { error } = await supabase.from("jobs").update(payload).eq("id", jobId);
    setSaving(false);

    if (error) {
      alert(`更新失敗: ${error.message}`);
      return;
    }

    void load();
  };

  const uploadDocument = async (file: File) => {
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 80);
    const path = `documents/${jobId}/${Date.now()}_${safeName}`;
    const uploadResult = await uploadFile(
      "pdfs",
      path,
      file,
      file.type || "application/pdf",
    );

    if (uploadResult.error) {
      alert(`PDF の取得に失敗しました: ${uploadResult.error.message}`);
      return;
    }

    const supabase = createClient();
    const { error } = await supabase.from("job_documents").insert([
      {
        job_id: jobId,
        doc_type: docType,
        file_name: file.name,
        file_path: path,
      },
    ]);

    if (error) {
      alert(`書類登録失敗: ${error.message}`);
      return;
    }

    void load();
  };

  const deleteDocument = async (document: JobDocumentWithUrl) => {
    if (!window.confirm("書類を削除しますか？")) {
      return;
    }

    const storageResult = await removeFile("pdfs", document.file_path);
    if (storageResult.error) {
      alert(`書類の削除に失敗しました: ${storageResult.error.message}`);
      return;
    }

    const supabase = createClient();
    const { error } = await supabase
      .from("job_documents")
      .delete()
      .eq("id", document.id);
    if (error) {
      alert(`書類の削除に失敗しました: ${error.message}`);
      return;
    }
    void load();
  };

  if (loading) {
    return <p className="text-sm text-slate-500">読み込み中...</p>;
  }

  if (!job) {
    return <p className="text-sm text-slate-500">案件が見つかりません。</p>;
  }

  const room = job.rooms;
  const property = room?.properties;
  const company = property?.management_companies;
  const outsourcingTotal = workOrders.reduce(
    (sum, item) => sum + (item.is_provisional ? 0 : item.total ?? 0),
    0,
  );

  const renderDocumentTable = (
    title: string,
    description: string,
    rows: DocumentListItem[],
  ) => (
    <Card>
      <CardHeader title={title} description={description} />
      <CardBody>
        {rows.length === 0 ? (
          <EmptyState title={`まだ${title}がありません`} description="実機の元システムにある PDF を参照中です。" />
        ) : (
          <TableWrap>
            <table className="min-w-full text-sm">
              <thead className="border-b border-line bg-panel-strong/70 text-left text-slate-500">
                <tr>
                  <th className="px-4 py-3">番号</th>
                  <th className="px-4 py-3">日付</th>
                  <th className="px-4 py-3">金額</th>
                  <th className="px-4 py-3">状態</th>
                  <th className="px-4 py-3 text-right">PDF</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((item) => (
                  <tr key={item.id} className="border-b border-line/70">
                    <td className="px-4 py-3 font-medium text-slate-900">{item.label}</td>
                    <td className="px-4 py-3 text-slate-600">{formatDate(item.issueDate)}</td>
                    <td className="px-4 py-3 text-slate-600">{formatCurrency(item.total)}</td>
                    <td className="px-4 py-3 text-slate-500">{item.meta || "-"}</td>
                    <td className="px-4 py-3 text-right">
                      {item.signedUrl ? (
                        <a
                          href={item.signedUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex rounded-xl bg-slate-100 px-3 py-2 font-medium text-slate-700 hover:bg-slate-200"
                        >
                          開く
                        </a>
                      ) : (
                        <span className="text-xs text-slate-400">未生成</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableWrap>
        )}
      </CardBody>
    </Card>
  );

  return (
    <div>
      <PageHeader
        title={job.title}
        description={`${company?.name ?? "管理会社なし"} / ${property?.name ?? "-"} / ${
          room?.room_number ?? "-"
        }`}
        action={
          <div className="flex flex-wrap gap-2">
            {room?.id ? (
              <Link
                href={`/dashboard/rooms/${room.id}/photos`}
                className="inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-soft"
              >
                <ImageIcon size={14} />
                写真
              </Link>
            ) : null}
            <Link
              href="/dashboard/jobs"
              className="inline-flex items-center gap-2 rounded-xl border border-line bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-panel-strong"
            >
              <ArrowLeft size={14} />
              案件一覧
            </Link>
          </div>
        }
      />

      <Card className="mb-6">
        <CardBody className="flex flex-col gap-4 py-5 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <Badge
              className={
                jobStatusOptions.find((item) => item.value === job.status)?.classes
              }
            >
              {getStatusLabel(job.status)}
            </Badge>
            <span className="text-sm text-slate-500">
              案件番号 {job.job_number || "-"}
            </span>
          </div>
          <div className="text-sm text-slate-600">
            外注合計 {formatCurrency(outsourcingTotal)}
          </div>
        </CardBody>
      </Card>

      <form className="space-y-6" onSubmit={save}>
        <DataGrid className="xl:grid-cols-[1fr_1fr]">
          <Card>
            <CardHeader title="案件情報" description="タイトル、番号、工事種別、備考" />
            <CardBody className="space-y-4">
              <Field label="案件名">
                <Input
                  value={form.title ?? ""}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, title: event.target.value }))
                  }
                />
              </Field>
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="案件番号">
                  <Input
                    value={form.job_number ?? ""}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        job_number: event.target.value,
                      }))
                    }
                  />
                </Field>
                <Field label="工事種別">
                  <Select
                    value={form.job_type ?? "原状回復工事"}
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
              </div>
              <Field label="ステータス">
                <Select
                  value={form.status ?? job.status}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      status: event.target.value as Job["status"],
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
              <Field label="備考">
                <Textarea
                  rows={5}
                  value={form.notes ?? ""}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, notes: event.target.value }))
                  }
                />
              </Field>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="入居者情報" description="契約、退去、敷金、預り金" />
            <CardBody className="space-y-4">
              <Field label="賃借人名">
                <Input
                  value={form.tenant_name ?? ""}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      tenant_name: event.target.value,
                    }))
                  }
                />
              </Field>
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="契約日">
                  <Input
                    type="date"
                    value={(form.contract_date ?? "").slice(0, 10)}
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
                    value={(form.move_out_date ?? "").slice(0, 10)}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        move_out_date: event.target.value,
                      }))
                    }
                  />
                </Field>
                <Field label="敷金">
                  <Input
                    type="number"
                    value={form.deposit_amount ?? ""}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        deposit_amount: event.target.value
                          ? Number(event.target.value)
                          : null,
                      }))
                    }
                  />
                </Field>
                <Field label="預り金">
                  <Input
                    type="number"
                    value={form.prepaid_amount ?? ""}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        prepaid_amount: event.target.value
                          ? Number(event.target.value)
                          : null,
                      }))
                    }
                  />
                </Field>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="立ち会い・現調情報" description="日時、担当、鍵、オートロック解除" />
            <CardBody className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="立ち会い日時">
                  <Input
                    type="datetime-local"
                    value={form.inspection_date ? form.inspection_date.slice(0, 16) : ""}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        inspection_date: event.target.value
                          ? new Date(event.target.value).toISOString()
                          : null,
                      }))
                    }
                  />
                </Field>
                <Field label="現調担当者">
                  <Input
                    value={form.inspector_name ?? ""}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        inspector_name: event.target.value,
                      }))
                    }
                  />
                </Field>
              </div>
              <Field label="鍵設置場所">
                <Input
                  value={form.key_location ?? ""}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      key_location: event.target.value,
                    }))
                  }
                />
              </Field>
              <Field label="オートロック解除">
                <Input
                  value={form.autolock_release ?? ""}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      autolock_release: event.target.value,
                    }))
                  }
                />
              </Field>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="受注・請求・入金" description="受注金額、工期、請求月、入金日、支払条件上書き" />
            <CardBody className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="受注金額">
                  <Input
                    type="number"
                    value={form.order_amount ?? ""}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        order_amount: event.target.value
                          ? Number(event.target.value)
                          : null,
                      }))
                    }
                  />
                </Field>
                <Field label="紹介料">
                  <Input
                    type="number"
                    value={form.referral_fee ?? ""}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        referral_fee: event.target.value
                          ? Number(event.target.value)
                          : null,
                      }))
                    }
                  />
                </Field>
                <Field label="受注日">
                  <Input
                    type="date"
                    value={(form.order_date ?? "").slice(0, 10)}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        order_date: event.target.value,
                      }))
                    }
                  />
                </Field>
                <Field label="請求月">
                  <Input
                    type="month"
                    value={form.billing_month ?? ""}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        billing_month: event.target.value,
                      }))
                    }
                  />
                </Field>
                <Field label="施工開始日">
                  <Input
                    type="date"
                    value={(form.work_start_date ?? "").slice(0, 10)}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        work_start_date: event.target.value,
                      }))
                    }
                  />
                </Field>
                <Field label="施工完了日">
                  <Input
                    type="date"
                    value={(form.work_end_date ?? "").slice(0, 10)}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        work_end_date: event.target.value,
                      }))
                    }
                  />
                </Field>
                <Field label="請求日">
                  <Input
                    type="date"
                    value={(form.billed_at ?? "").slice(0, 10)}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        billed_at: event.target.value,
                      }))
                    }
                  />
                </Field>
                <Field label="入金日">
                  <Input
                    type="date"
                    value={(form.payment_received_at ?? "").slice(0, 10)}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        payment_received_at: event.target.value,
                      }))
                    }
                  />
                </Field>
                <Field label="カギ返却日">
                  <Input
                    type="date"
                    value={(form.key_returned_at ?? "").slice(0, 10)}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        key_returned_at: event.target.value,
                      }))
                    }
                  />
                </Field>
                <Field label="支払条件（管理会社の上書き）">
                  <Input
                    value={form.payment_terms_override ?? ""}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        payment_terms_override: event.target.value,
                      }))
                    }
                  />
                </Field>
              </div>
            </CardBody>
          </Card>
        </DataGrid>

        <div className="mt-6 flex flex-wrap gap-3">
          <Button type="submit" disabled={saving}>
            {saving ? "保存中..." : "保存"}
          </Button>
          {room?.id ? (
            <Link
              href={`/dashboard/rooms/${room.id}/photos`}
              className="inline-flex items-center gap-2 rounded-xl border border-line bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-panel-strong"
            >
              <ImageIcon size={14} />
              この号室の写真を見る・追加する
            </Link>
          ) : null}
        </div>
      </form>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader
            title={`外注管理 (${workOrders.length}件)`}
            description={`外注合計 ${formatCurrency(outsourcingTotal)}`}
          />
          <CardBody>
            {workOrders.length === 0 ? (
              <EmptyState
                title="まだ施工依頼書がありません"
                description="元システム側で発行済みのものがあればここに表示されます。"
              />
            ) : (
              <TableWrap>
                <table className="min-w-full text-sm">
                  <thead className="border-b border-line bg-panel-strong/70 text-left text-slate-500">
                    <tr>
                      <th className="px-4 py-3">発注番号</th>
                      <th className="px-4 py-3">業者</th>
                      <th className="px-4 py-3">金額</th>
                      <th className="px-4 py-3">完工</th>
                    </tr>
                  </thead>
                  <tbody>
                    {workOrders.map((item) => (
                      <tr key={item.id} className="border-b border-line/70">
                        <td className="px-4 py-3 font-medium text-slate-900">
                          {item.order_number}
                        </td>
                        <td className="px-4 py-3 text-slate-600">
                          {item.contractors?.name || "-"}
                        </td>
                        <td className="px-4 py-3 text-slate-600">
                          {formatCurrency(item.total)}
                        </td>
                        <td className="px-4 py-3 text-slate-600">
                          {formatDate(item.completion_date)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </TableWrap>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="書類" description="任意の PDF を案件に保管できます。" />
          <CardBody className="space-y-4">
            <input
              ref={uploadRef}
              type="file"
              accept="application/pdf"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) {
                  void uploadDocument(file);
                }
                event.target.value = "";
              }}
            />
            <div className="flex flex-wrap gap-3">
              <Select
                className="max-w-xs"
                value={docType}
                onChange={(event) => setDocType(event.target.value)}
              >
                <option value="賃貸借契約書">賃貸借契約書</option>
                <option value="重要事項説明書">重要事項説明書</option>
                <option value="解約通知書">解約通知書</option>
                <option value="その他">その他</option>
              </Select>
              <Button type="button" variant="secondary" onClick={() => uploadRef.current?.click()}>
                <FileUp size={14} />
                PDF を選択
              </Button>
            </div>
            {documents.length === 0 ? (
              <EmptyState
                title="まだ書類がありません"
                description="賃貸借契約書・重要事項説明書・解約通知書などの PDF を保管できます。"
              />
            ) : (
              <div className="space-y-3">
                {documents.map((document) => (
                  <div
                    key={document.id}
                    className="flex flex-col gap-3 rounded-2xl border border-line bg-white px-4 py-4 md:flex-row md:items-center md:justify-between"
                  >
                    <div>
                      <p className="font-medium text-slate-900">{document.file_name}</p>
                      <p className="mt-1 text-sm text-slate-500">{document.doc_type}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {document.signedUrl ? (
                        <a
                          href={document.signedUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex rounded-xl bg-slate-100 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200"
                        >
                          開く
                        </a>
                      ) : null}
                      <Button
                        type="button"
                        variant="danger"
                        onClick={() => void deleteDocument(document)}
                      >
                        削除
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardBody>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <Card>
          <CardHeader
            title="見積書"
            description="アプリ内で作成・PDF生成できます"
            action={
              companySettings ? (
                <button
                  onClick={() => {
                    setEditingQuote(null);
                    setShowQuoteForm(true);
                  }}
                  className="inline-flex items-center gap-1 rounded-lg bg-brand px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-soft"
                >
                  <Plus size={14} />
                  新規作成
                </button>
              ) : null
            }
          />
          <CardBody>
            {quotes.length === 0 ? (
              <EmptyState title="まだ見積書がありません" description="「新規作成」ボタンから作成できます。" />
            ) : (
              <TableWrap>
                <table className="min-w-full text-sm">
                  <thead className="border-b border-line bg-panel-strong/70 text-left text-slate-500">
                    <tr>
                      <th className="px-4 py-3">番号</th>
                      <th className="px-4 py-3">日付</th>
                      <th className="px-4 py-3">金額</th>
                      <th className="px-4 py-3 text-right">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {quotes.map((item) => (
                      <tr key={item.id} className="border-b border-line/70">
                        <td className="px-4 py-3 font-medium text-slate-900">{item.label}</td>
                        <td className="px-4 py-3 text-slate-600">{formatDate(item.issueDate)}</td>
                        <td className="px-4 py-3 text-slate-600">{formatCurrency(item.total)}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-2">
                            {companySettings ? (
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingQuote(
                                    quotesRaw.find((q) => q.id === item.id) ?? null,
                                  );
                                  setShowQuoteForm(true);
                                }}
                                className="inline-flex rounded-xl border border-line bg-white px-3 py-2 font-medium text-slate-700 hover:bg-panel-strong"
                              >
                                編集
                              </button>
                            ) : null}
                            {item.signedUrl ? (
                              <a href={item.signedUrl} target="_blank" rel="noreferrer"
                                className="inline-flex rounded-xl bg-slate-100 px-3 py-2 font-medium text-slate-700 hover:bg-slate-200">
                                開く
                              </a>
                            ) : (
                              <span className="text-xs text-slate-400">未生成</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </TableWrap>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            title="入居者請求書"
            description="電子サイン付きPDFを生成できます"
            action={
              companySettings ? (
                <button
                  onClick={() => {
                    setEditingInvoice(null);
                    setShowInvoiceForm(true);
                  }}
                  className="inline-flex items-center gap-1 rounded-lg bg-brand px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-soft"
                >
                  <Plus size={14} />
                  新規作成
                </button>
              ) : null
            }
          />
          <CardBody>
            {tenantInvoices.length === 0 ? (
              <EmptyState title="まだ入居者請求書がありません" description="「新規作成」ボタンから作成できます。" />
            ) : (
              <TableWrap>
                <table className="min-w-full text-sm">
                  <thead className="border-b border-line bg-panel-strong/70 text-left text-slate-500">
                    <tr>
                      <th className="px-4 py-3">番号</th>
                      <th className="px-4 py-3">日付</th>
                      <th className="px-4 py-3">金額</th>
                      <th className="px-4 py-3">サイン</th>
                      <th className="px-4 py-3 text-right">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tenantInvoices.map((item) => (
                      <tr key={item.id} className="border-b border-line/70">
                        <td className="px-4 py-3 font-medium text-slate-900">{item.label}</td>
                        <td className="px-4 py-3 text-slate-600">{formatDate(item.issueDate)}</td>
                        <td className="px-4 py-3 text-slate-600">{formatCurrency(item.total)}</td>
                        <td className="px-4 py-3 text-slate-500">{item.meta || "未サイン"}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-2">
                            {companySettings ? (
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingInvoice(
                                    invoicesRaw.find((q) => q.id === item.id) ?? null,
                                  );
                                  setShowInvoiceForm(true);
                                }}
                                className="inline-flex rounded-xl border border-line bg-white px-3 py-2 font-medium text-slate-700 hover:bg-panel-strong"
                              >
                                編集
                              </button>
                            ) : null}
                            {item.signedUrl ? (
                              <a href={item.signedUrl} target="_blank" rel="noreferrer"
                                className="inline-flex rounded-xl bg-slate-100 px-3 py-2 font-medium text-slate-700 hover:bg-slate-200">
                                開く
                              </a>
                            ) : (
                              <span className="text-xs text-slate-400">未生成</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </TableWrap>
            )}
          </CardBody>
        </Card>

        {renderDocumentTable(
          "立会チェックリスト",
          "立会レポート PDF とサイン状況",
          inspectionReports,
        )}
      </div>

      {showQuoteForm && companySettings ? (
        <QuoteForm
          jobId={jobId}
          jobTitle={job.title}
          managementCompanyName={company?.name ?? ""}
          company={companySettings}
          existing={editingQuote}
          onClose={() => {
            setShowQuoteForm(false);
            setEditingQuote(null);
          }}
          onSaved={() => void load()}
        />
      ) : null}

      {showInvoiceForm && companySettings ? (
        <TenantInvoiceForm
          jobId={jobId}
          jobTitle={job.title}
          tenantName={job.tenant_name ?? ""}
          depositAmount={job.deposit_amount ?? 0}
          prepaidAmount={job.prepaid_amount ?? 0}
          company={companySettings}
          existing={editingInvoice}
          onClose={() => {
            setShowInvoiceForm(false);
            setEditingInvoice(null);
          }}
          onSaved={() => void load()}
        />
      ) : null}

      <Card className="mt-6">
        <CardHeader title="物件情報" description="号室、間取り、住所、管理会社" />
        <CardBody className="grid gap-4 text-sm md:grid-cols-2 xl:grid-cols-4">
          <div>
            <p className="text-slate-500">管理会社</p>
            <p className="mt-1 font-medium text-slate-900">{company?.name || "-"}</p>
          </div>
          <div>
            <p className="text-slate-500">物件名</p>
            <p className="mt-1 font-medium text-slate-900">{property?.name || "-"}</p>
          </div>
          <div>
            <p className="text-slate-500">号室</p>
            <p className="mt-1 font-medium text-slate-900">{room?.room_number || "-"}</p>
          </div>
          <div>
            <p className="text-slate-500">間取り / 面積</p>
            <p className="mt-1 font-medium text-slate-900">
              {room?.layout || "-"} / {room?.area ?? "-"}㎡
            </p>
          </div>
          <div className="md:col-span-2 xl:col-span-4">
            <p className="text-slate-500">住所</p>
            <p className="mt-1 font-medium text-slate-900">{property?.address || "-"}</p>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
