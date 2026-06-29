"use client";

import { pdf } from "@react-pdf/renderer";
import { Loader2, Plus, Trash2, X } from "lucide-react";
import { useEffect, useState } from "react";

import { ItemSelect } from "@/components/item-select";
import { QuotePdf } from "@/components/pdf/quote-pdf";
import { Button, Field, Input, Textarea } from "@/components/ui";
import { emptyMasters, loadMasters, type Masters } from "@/lib/masters";
import { uploadFile } from "@/lib/storage";
import { createClient } from "@/lib/supabase/browser";
import type { CompanySettings, Quote, QuoteLineItem } from "@/lib/types";

type Props = {
  jobId: string;
  jobTitle: string;
  managementCompanyName: string;
  company: CompanySettings;
  existing?: Quote | null;
  onClose: () => void;
  onSaved: () => void;
};

const emptyItem = (): QuoteLineItem => ({
  name: "",
  qty: 1,
  unit: "式",
  unit_price: 0,
  amount: 0,
  work_item_id: null,
  category: null,
  description: "",
});

const toItems = (existing?: Quote | null): QuoteLineItem[] => {
  const list = existing?.line_items;
  if (list && list.length > 0) {
    return list.map((it) => ({
      ...emptyItem(),
      ...it,
      amount: (it.qty || 0) * (it.unit_price || 0),
    }));
  }
  return [emptyItem()];
};

const yen = (value: number) => `¥${Math.round(value).toLocaleString("ja-JP")}`;

export function QuoteForm({
  jobId,
  jobTitle,
  managementCompanyName,
  company,
  existing,
  onClose,
  onSaved,
}: Props) {
  const today = new Date().toISOString().slice(0, 10);
  const [issueDate, setIssueDate] = useState(existing?.issue_date?.slice(0, 10) || today);
  const [notes, setNotes] = useState(existing?.notes ?? "");
  const [items, setItems] = useState<QuoteLineItem[]>(() => toItems(existing));
  const [masters, setMasters] = useState<Masters>(emptyMasters());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void loadMasters().then(setMasters);
  }, []);

  const updateItem = (index: number, patch: Partial<QuoteLineItem>) => {
    setItems((prev) =>
      prev.map((item, i) => {
        if (i !== index) return item;
        const next = { ...item, ...patch };
        next.amount = (next.qty || 0) * (next.unit_price || 0);
        return next;
      }),
    );
  };

  const pickItem = (
    index: number,
    sel: { category: string | null; workItemId: string | null; workItem: Masters["workItems"][number] | null },
  ) => {
    setItems((prev) =>
      prev.map((item, i) => {
        if (i !== index) return item;
        if (!sel.workItem) {
          return { ...item, category: sel.category, work_item_id: null };
        }
        const price = masters.quotePriceMap[sel.workItem.id];
        const unit = price?.unit ?? sel.workItem.default_unit ?? item.unit;
        const unitPrice = price?.unit_price ?? item.unit_price;
        return {
          ...item,
          category: sel.category,
          work_item_id: sel.workItem.id,
          name: sel.workItem.name,
          unit: unit || item.unit,
          unit_price: unitPrice,
          description: item.description || sel.workItem.default_description || "",
          amount: (item.qty || 0) * unitPrice,
        };
      }),
    );
  };

  const addItem = () => setItems((prev) => [...prev, emptyItem()]);
  const removeItem = (index: number) =>
    setItems((prev) => (prev.length === 1 ? prev : prev.filter((_, i) => i !== index)));

  const subtotal = items.reduce((sum, item) => sum + item.amount, 0);
  const tax = Math.floor(subtotal * 0.1);
  const total = subtotal + tax;

  const handleSave = async () => {
    if (items.some((item) => !item.name)) {
      setError("工事項目名を入力してください（区分→項目を選ぶか、直接入力できます）");
      return;
    }
    setError(null);
    setSaving(true);
    const supabase = createClient();

    const quoteNumber =
      existing?.quote_number ??
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
      setError(`PDF アップロードに失敗しました: ${uploadResult.error.message}`);
      setSaving(false);
      return;
    }

    const payload = {
      issue_date: issueDate,
      total,
      pdf_path: pdfPath,
      line_items: items,
      notes,
    };

    if (existing?.id) {
      const { error: updateError } = await supabase
        .from("quotes")
        .update(payload)
        .eq("id", existing.id);
      if (updateError) {
        setError(`保存失敗: ${updateError.message}`);
        setSaving(false);
        return;
      }
    } else {
      const { error: insertError } = await supabase
        .from("quotes")
        .insert([{ job_id: jobId, quote_number: quoteNumber, ...payload }]);
      if (insertError) {
        setError(`保存失敗: ${insertError.message}`);
        setSaving(false);
        return;
      }
    }

    setSaving(false);
    onSaved();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-3 pt-6 sm:p-4 sm:pt-8">
      <div className="w-full max-w-3xl rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-line px-5 py-4 sm:px-6">
          <h2 className="font-semibold text-slate-900">
            {existing ? "見積書を編集" : "見積書を作成"}
          </h2>
          <button
            onClick={onClose}
            aria-label="閉じる"
            className="flex h-10 w-10 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <X size={18} />
          </button>
        </div>

        <div className="space-y-6 p-5 sm:p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="発行日">
              <Input
                type="date"
                value={issueDate}
                onChange={(e) => setIssueDate(e.target.value)}
              />
            </Field>
            <div className="rounded-xl border border-line bg-panel px-4 py-3 text-sm">
              <p className="text-slate-500">宛先（管理会社）</p>
              <p className="mt-1 font-medium text-slate-900">
                {managementCompanyName || "（未設定）"}
              </p>
            </div>
          </div>

          <div>
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-medium text-slate-700">工事明細</p>
              <button
                onClick={addItem}
                className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-3 py-2 text-sm text-slate-700 hover:bg-slate-200"
              >
                <Plus size={14} />
                行を追加
              </button>
            </div>

            <div className="space-y-3">
              {items.map((item, index) => (
                <div
                  key={index}
                  className="space-y-3 rounded-xl border border-line bg-white p-3 sm:p-4"
                >
                  <div className="flex items-start gap-2">
                    <div className="flex-1">
                      <ItemSelect
                        masters={masters}
                        value={{
                          category: item.category ?? null,
                          workItemId: item.work_item_id ?? null,
                        }}
                        onChange={(sel) => pickItem(index, sel)}
                      />
                    </div>
                    <button
                      onClick={() => removeItem(index)}
                      aria-label="この行を削除"
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-500"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  <Input
                    value={item.name}
                    onChange={(e) => updateItem(index, { name: e.target.value })}
                    placeholder="工事項目名（例：クロス張替え）"
                  />
                  <Input
                    value={item.description ?? ""}
                    onChange={(e) => updateItem(index, { description: e.target.value })}
                    placeholder="摘要（任意・補足説明）"
                  />

                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    <label className="block">
                      <span className="mb-1 block text-xs text-slate-500">数量</span>
                      <Input
                        type="number"
                        inputMode="decimal"
                        step="0.01"
                        min={0}
                        className="text-right"
                        value={item.qty}
                        onChange={(e) =>
                          updateItem(index, { qty: parseFloat(e.target.value) || 0 })
                        }
                      />
                    </label>
                    <label className="block">
                      <span className="mb-1 block text-xs text-slate-500">単位</span>
                      <Input
                        className="text-center"
                        value={item.unit}
                        onChange={(e) => updateItem(index, { unit: e.target.value })}
                      />
                    </label>
                    <label className="block">
                      <span className="mb-1 block text-xs text-slate-500">単価</span>
                      <Input
                        type="number"
                        inputMode="numeric"
                        step="1"
                        min={0}
                        className="text-right"
                        value={item.unit_price}
                        onChange={(e) =>
                          updateItem(index, { unit_price: parseFloat(e.target.value) || 0 })
                        }
                      />
                    </label>
                    <div className="block">
                      <span className="mb-1 block text-xs text-slate-500">金額</span>
                      <p className="rounded-xl bg-panel px-3 py-2.5 text-right text-sm font-medium text-slate-900">
                        {yen(item.amount)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-line bg-panel p-4">
            <div className="ml-auto max-w-xs space-y-1 text-sm text-slate-600">
              <div className="flex justify-between">
                <span>小計</span>
                <span>{yen(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span>消費税（10%）</span>
                <span>{yen(tax)}</span>
              </div>
              <div className="flex justify-between border-t border-line pt-1 text-base font-semibold text-slate-900">
                <span>合計</span>
                <span>{yen(total)}</span>
              </div>
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

          {error ? (
            <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </p>
          ) : null}
        </div>

        <div className="flex justify-end gap-3 border-t border-line px-5 py-4 sm:px-6">
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            キャンセル
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                PDF生成・保存中...
              </>
            ) : (
              "PDF生成して保存"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
