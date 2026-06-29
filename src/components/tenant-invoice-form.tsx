"use client";

import { pdf } from "@react-pdf/renderer";
import { Plus, Trash2, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type ReactSignatureCanvas from "react-signature-canvas";

import { TenantInvoicePdf } from "@/components/pdf/tenant-invoice-pdf";
import { Button, Field, Input, Textarea } from "@/components/ui";
import { uploadFile } from "@/lib/storage";
import { createClient } from "@/lib/supabase/browser";
import type { CompanySettings, TenantInvoiceLineItem } from "@/lib/types";

type Props = {
  jobId: string;
  jobTitle: string;
  tenantName: string;
  depositAmount: number;
  prepaidAmount: number;
  company: CompanySettings;
  existingInvoiceId?: string;
  existingInvoiceNumber?: string;
  onClose: () => void;
  onSaved: () => void;
};

const emptyItem = (): TenantInvoiceLineItem => ({
  name: "",
  qty: 1,
  unit: "式",
  unit_price: 0,
  amount: 0,
  ratio: 100,
  tenant_amount: 0,
});

export function TenantInvoiceForm({
  jobId,
  jobTitle,
  tenantName,
  depositAmount,
  prepaidAmount,
  company,
  existingInvoiceId,
  existingInvoiceNumber,
  onClose,
  onSaved,
}: Props) {
  const today = new Date().toISOString().slice(0, 10);
  const [issueDate, setIssueDate] = useState(today);
  const [notes, setNotes] = useState("");
  const [depositOffset, setDepositOffset] = useState(0);
  const [items, setItems] = useState<TenantInvoiceLineItem[]>([emptyItem()]);
  const [saving, setSaving] = useState(false);
  const [SignatureCanvas, setSignatureCanvas] = useState<typeof ReactSignatureCanvas | null>(null);
  const sigRef = useRef<ReactSignatureCanvas | null>(null);

  useEffect(() => {
    void import("react-signature-canvas").then((mod) => {
      setSignatureCanvas(() => mod.default);
    });
  }, []);

  const updateItem = (index: number, patch: Partial<TenantInvoiceLineItem>) => {
    setItems((prev) =>
      prev.map((item, i) => {
        if (i !== index) return item;
        const next = { ...item, ...patch };
        next.amount = next.qty * next.unit_price;
        next.tenant_amount = Math.floor(next.amount * (next.ratio / 100));
        return next;
      }),
    );
  };

  const addItem = () => setItems((prev) => [...prev, emptyItem()]);
  const removeItem = (index: number) =>
    setItems((prev) => prev.filter((_, i) => i !== index));

  const tenantSubtotal = items.reduce((sum, item) => sum + item.tenant_amount, 0);
  const tax = Math.floor(tenantSubtotal * 0.1);
  const grossTotal = tenantSubtotal + tax;
  const received = (depositAmount || 0) + (prepaidAmount || 0);
  const balance = grossTotal - received - (depositOffset || 0);

  const handleSave = async () => {
    if (items.some((item) => !item.name)) {
      alert("工事項目名を入力してください");
      return;
    }

    setSaving(true);
    const supabase = createClient();

    const signatureDataUrl =
      sigRef.current && !(sigRef.current as ReactSignatureCanvas).isEmpty()
        ? (sigRef.current as ReactSignatureCanvas).toDataURL()
        : null;

    const invoiceNumber =
      existingInvoiceNumber ??
      `T${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, "0")}${String(Date.now()).slice(-4)}`;

    const blob = await pdf(
      <TenantInvoicePdf
        invoiceNumber={invoiceNumber}
        issueDate={issueDate}
        tenantName={tenantName}
        lineItems={items}
        depositAmount={depositAmount || 0}
        prepaidAmount={prepaidAmount || 0}
        depositOffset={depositOffset || 0}
        notes={notes}
        subjectName={jobTitle}
        company={company}
        signatureDataUrl={signatureDataUrl}
      />,
    ).toBlob();

    const pdfPath = `tenant_invoices/${jobId}/${invoiceNumber}.pdf`;
    const uploadResult = await uploadFile("pdfs", pdfPath, blob, "application/pdf");

    if (uploadResult.error) {
      alert(`PDF アップロードに失敗しました: ${uploadResult.error.message}`);
      setSaving(false);
      return;
    }

    const payload = {
      issue_date: issueDate,
      total: balance,
      pdf_path: pdfPath,
      line_items: items,
      deposit_offset: depositOffset,
      notes,
      tenant_signature: signatureDataUrl,
    };

    if (existingInvoiceId) {
      const { error } = await supabase
        .from("tenant_invoices")
        .update(payload)
        .eq("id", existingInvoiceId);

      if (error) {
        alert(`保存失敗: ${error.message}`);
        setSaving(false);
        return;
      }
    } else {
      const { error } = await supabase.from("tenant_invoices").insert([
        {
          job_id: jobId,
          invoice_number: invoiceNumber,
          ...payload,
        },
      ]);

      if (error) {
        alert(`保存失敗: ${error.message}`);
        setSaving(false);
        return;
      }
    }

    setSaving(false);
    onSaved();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4 pt-8">
      <div className="w-full max-w-4xl rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-line px-6 py-4">
          <h2 className="font-semibold text-slate-900">入居者請求書を作成</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <X size={18} />
          </button>
        </div>

        <div className="space-y-6 p-6">
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="発行日">
              <Input
                type="date"
                value={issueDate}
                onChange={(e) => setIssueDate(e.target.value)}
              />
            </Field>
            <div className="rounded-xl border border-line bg-panel px-4 py-3 text-sm">
              <p className="text-slate-500">入居者名</p>
              <p className="mt-1 font-medium text-slate-900">{tenantName || "（未設定）"}</p>
            </div>
          </div>

          <div>
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-medium text-slate-700">工事明細（入居者負担割合入力）</p>
              <button
                onClick={addItem}
                className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-200"
              >
                <Plus size={14} />
                行を追加
              </button>
            </div>

            <div className="overflow-x-auto rounded-xl border border-line">
              <table className="min-w-full text-sm">
                <thead className="border-b border-line bg-panel text-slate-500">
                  <tr>
                    <th className="px-3 py-2 text-left">工事項目名</th>
                    <th className="w-16 px-3 py-2 text-right">数量</th>
                    <th className="w-16 px-3 py-2 text-center">単位</th>
                    <th className="w-24 px-3 py-2 text-right">単価</th>
                    <th className="w-24 px-3 py-2 text-right">金額</th>
                    <th className="w-20 px-3 py-2 text-right">負担%</th>
                    <th className="w-28 px-3 py-2 text-right">入居者負担額</th>
                    <th className="w-8 px-3 py-2" />
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, index) => (
                    <tr key={index} className="border-b border-line/50">
                      <td className="px-2 py-1.5">
                        <input
                          className="w-full rounded-lg border border-line px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30"
                          value={item.name}
                          onChange={(e) => updateItem(index, { name: e.target.value })}
                          placeholder="例：クロス張替え"
                        />
                      </td>
                      <td className="px-2 py-1.5">
                        <input
                          type="number"
                          className="w-full rounded-lg border border-line px-2 py-1 text-right text-sm focus:outline-none focus:ring-2 focus:ring-brand/30"
                          value={item.qty}
                          min={0}
                          onChange={(e) =>
                            updateItem(index, { qty: parseFloat(e.target.value) || 0 })
                          }
                        />
                      </td>
                      <td className="px-2 py-1.5">
                        <input
                          className="w-full rounded-lg border border-line px-2 py-1 text-center text-sm focus:outline-none focus:ring-2 focus:ring-brand/30"
                          value={item.unit}
                          onChange={(e) => updateItem(index, { unit: e.target.value })}
                        />
                      </td>
                      <td className="px-2 py-1.5">
                        <input
                          type="number"
                          className="w-full rounded-lg border border-line px-2 py-1 text-right text-sm focus:outline-none focus:ring-2 focus:ring-brand/30"
                          value={item.unit_price}
                          min={0}
                          onChange={(e) =>
                            updateItem(index, {
                              unit_price: parseFloat(e.target.value) || 0,
                            })
                          }
                        />
                      </td>
                      <td className="px-3 py-1.5 text-right text-slate-700">
                        ¥{item.amount.toLocaleString("ja-JP")}
                      </td>
                      <td className="px-2 py-1.5">
                        <input
                          type="number"
                          className="w-full rounded-lg border border-line px-2 py-1 text-right text-sm focus:outline-none focus:ring-2 focus:ring-brand/30"
                          value={item.ratio}
                          min={0}
                          max={100}
                          onChange={(e) =>
                            updateItem(index, {
                              ratio: parseFloat(e.target.value) || 0,
                            })
                          }
                        />
                      </td>
                      <td className="px-3 py-1.5 text-right font-medium text-slate-900">
                        ¥{item.tenant_amount.toLocaleString("ja-JP")}
                      </td>
                      <td className="px-2 py-1.5">
                        <button
                          onClick={() => removeItem(index)}
                          className="rounded p-1 text-slate-300 hover:bg-red-50 hover:text-red-400"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="rounded-xl border border-line bg-panel p-4">
            <p className="mb-3 text-sm font-medium text-slate-700">敷金・相殺計算</p>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="text-sm text-slate-600">
                <p>入居者負担小計: ¥{tenantSubtotal.toLocaleString("ja-JP")}</p>
                <p>消費税（10%）: ¥{tax.toLocaleString("ja-JP")}</p>
                <p className="font-medium">入居者負担合計: ¥{grossTotal.toLocaleString("ja-JP")}</p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">敷金</span>
                  <span>△¥{(depositAmount || 0).toLocaleString("ja-JP")}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">前払い金</span>
                  <span>△¥{(prepaidAmount || 0).toLocaleString("ja-JP")}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="shrink-0 text-slate-500">その他相殺額</span>
                  <input
                    type="number"
                    className="w-28 rounded-lg border border-line px-2 py-1 text-right text-sm focus:outline-none focus:ring-2 focus:ring-brand/30"
                    value={depositOffset}
                    min={0}
                    onChange={(e) => setDepositOffset(parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div className="border-t border-line pt-2 text-sm font-semibold">
                  {balance >= 0
                    ? `ご請求額: ¥${balance.toLocaleString("ja-JP")}`
                    : `ご返金額: ¥${Math.abs(balance).toLocaleString("ja-JP")}`}
                </div>
              </div>
            </div>
          </div>

          <Field label="備考">
            <Textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="特記事項など"
            />
          </Field>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <p className="text-sm font-medium text-slate-700">入居者サイン</p>
              <button
                onClick={() => (sigRef.current as ReactSignatureCanvas | null)?.clear()}
                className="rounded-lg px-3 py-1.5 text-sm text-slate-500 hover:bg-slate-100"
              >
                クリア
              </button>
            </div>
            <div className="overflow-hidden rounded-xl border border-line bg-slate-50" style={{ height: 160 }}>
              {SignatureCanvas ? (
                <SignatureCanvas
                  ref={sigRef}
                  penColor="#1e293b"
                  canvasProps={{
                    className: "w-full h-full",
                  }}
                  backgroundColor="rgb(248,250,252)"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-slate-400">
                  読み込み中...
                </div>
              )}
            </div>
            <p className="mt-1 text-xs text-slate-400">
              入居者に画面上でサインしてもらってください。サインなしでも保存できます。
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-3 border-t border-line px-6 py-4">
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            キャンセル
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "PDF生成・保存中..." : "PDF生成して保存"}
          </Button>
        </div>
      </div>
    </div>
  );
}
