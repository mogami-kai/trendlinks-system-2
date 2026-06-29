"use client";

import { pdf } from "@react-pdf/renderer";
import { Plus, Trash2, X } from "lucide-react";
import { useState } from "react";

import { QuotePdf } from "@/components/pdf/quote-pdf";
import { Button, Field, Input, Textarea } from "@/components/ui";
import { uploadFile } from "@/lib/storage";
import { createClient } from "@/lib/supabase/browser";
import type { CompanySettings, QuoteLineItem } from "@/lib/types";

type Props = {
  jobId: string;
  jobTitle: string;
  managementCompanyName: string;
  company: CompanySettings;
  existingQuoteId?: string;
  existingQuoteNumber?: string;
  onClose: () => void;
  onSaved: () => void;
};

const emptyItem = (): QuoteLineItem => ({
  name: "",
  qty: 1,
  unit: "式",
  unit_price: 0,
  amount: 0,
});

export function QuoteForm({
  jobId,
  jobTitle,
  managementCompanyName,
  company,
  existingQuoteId,
  existingQuoteNumber,
  onClose,
  onSaved,
}: Props) {
  const today = new Date().toISOString().slice(0, 10);
  const [issueDate, setIssueDate] = useState(today);
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<QuoteLineItem[]>([emptyItem()]);
  const [saving, setSaving] = useState(false);

  const updateItem = (index: number, patch: Partial<QuoteLineItem>) => {
    setItems((prev) =>
      prev.map((item, i) => {
        if (i !== index) return item;
        const next = { ...item, ...patch };
        next.amount = next.qty * next.unit_price;
        return next;
      }),
    );
  };

  const addItem = () => setItems((prev) => [...prev, emptyItem()]);
  const removeItem = (index: number) =>
    setItems((prev) => prev.filter((_, i) => i !== index));

  const subtotal = items.reduce((sum, item) => sum + item.amount, 0);
  const tax = Math.floor(subtotal * 0.1);
  const total = subtotal + tax;

  const handleSave = async () => {
    if (items.some((item) => !item.name)) {
      alert("工事項目名を入力してください");
      return;
    }

    setSaving(true);
    const supabase = createClient();

    const quoteNumber =
      existingQuoteNumber ??
      `Q${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, "0")}${String(Date.now()).slice(-4)}`;

    const blob = await pdf(
      <QuotePdf
        quoteNumber={quoteNumber}
        issueDate={issueDate}
        lineItems={items}
        notes={notes}
        subjectName={jobTitle}
        company={company}
        addressTo={managementCompanyName}
      />,
    ).toBlob();

    const pdfPath = `quotes/${jobId}/${quoteNumber}.pdf`;
    const uploadResult = await uploadFile("pdfs", pdfPath, blob, "application/pdf");

    if (uploadResult.error) {
      alert(`PDF アップロードに失敗しました: ${uploadResult.error.message}`);
      setSaving(false);
      return;
    }

    if (existingQuoteId) {
      const { error } = await supabase
        .from("quotes")
        .update({
          issue_date: issueDate,
          total,
          pdf_path: pdfPath,
          line_items: items,
          notes,
        })
        .eq("id", existingQuoteId);

      if (error) {
        alert(`保存失敗: ${error.message}`);
        setSaving(false);
        return;
      }
    } else {
      const { error } = await supabase.from("quotes").insert([
        {
          job_id: jobId,
          quote_number: quoteNumber,
          issue_date: issueDate,
          total,
          pdf_path: pdfPath,
          line_items: items,
          notes,
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
      <div className="w-full max-w-3xl rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-line px-6 py-4">
          <h2 className="font-semibold text-slate-900">見積書を作成</h2>
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
          </div>

          <div>
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-medium text-slate-700">工事明細</p>
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
                    <th className="w-28 px-3 py-2 text-right">単価</th>
                    <th className="w-28 px-3 py-2 text-right">金額</th>
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

            <div className="mt-3 space-y-1 text-right text-sm text-slate-600">
              <p>小計：¥{subtotal.toLocaleString("ja-JP")}</p>
              <p>消費税（10%）：¥{tax.toLocaleString("ja-JP")}</p>
              <p className="text-base font-semibold text-slate-900">
                合計：¥{total.toLocaleString("ja-JP")}
              </p>
            </div>
          </div>

          <Field label="備考">
            <Textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="有効期限、特記事項など"
            />
          </Field>
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
