"use client";

import { pdf } from "@react-pdf/renderer";
import { Loader2, Plus, Trash2, X } from "lucide-react";
import { useEffect, useState } from "react";

import { ItemSelect } from "@/components/item-select";
import { SignaturePad } from "@/components/signature-pad";
import { TenantInvoicePdf } from "@/components/pdf/tenant-invoice-pdf";
import { Button, Field, Input, Textarea } from "@/components/ui";
import { emptyMasters, loadMasters, type Masters } from "@/lib/masters";
import { uploadFile } from "@/lib/storage";
import { createClient } from "@/lib/supabase/browser";
import type { CompanySettings, TenantInvoice, TenantInvoiceLineItem } from "@/lib/types";

type Props = {
  jobId: string;
  jobTitle: string;
  tenantName: string;
  depositAmount: number;
  prepaidAmount: number;
  company: CompanySettings;
  existing?: TenantInvoice | null;
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
  landlord_amount: 0,
  work_item_id: null,
  category: null,
  description: "",
});

const recalc = (item: TenantInvoiceLineItem): TenantInvoiceLineItem => {
  const amount = (item.qty || 0) * (item.unit_price || 0);
  const tenant = Math.floor(amount * ((item.ratio || 0) / 100));
  return { ...item, amount, tenant_amount: tenant, landlord_amount: amount - tenant };
};

const toItems = (existing?: TenantInvoice | null): TenantInvoiceLineItem[] => {
  const list = existing?.line_items;
  if (list && list.length > 0) {
    return list.map((it) => recalc({ ...emptyItem(), ...it }));
  }
  return [emptyItem()];
};

const yen = (value: number) => `¥${Math.round(value).toLocaleString("ja-JP")}`;

export function TenantInvoiceForm({
  jobId,
  jobTitle,
  tenantName,
  depositAmount,
  prepaidAmount,
  company,
  existing,
  onClose,
  onSaved,
}: Props) {
  const today = new Date().toISOString().slice(0, 10);
  const [issueDate, setIssueDate] = useState(existing?.issue_date?.slice(0, 10) || today);
  const [notes, setNotes] = useState(existing?.notes ?? "");
  const [depositOffset, setDepositOffset] = useState(existing?.deposit_offset ?? 0);
  const [items, setItems] = useState<TenantInvoiceLineItem[]>(() => toItems(existing));
  const [signature, setSignature] = useState<string | null>(existing?.tenant_signature ?? null);
  const [masters, setMasters] = useState<Masters>(emptyMasters());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void loadMasters().then(setMasters);
  }, []);

  const updateItem = (index: number, patch: Partial<TenantInvoiceLineItem>) => {
    setItems((prev) =>
      prev.map((item, i) => (i === index ? recalc({ ...item, ...patch }) : item)),
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
        const price = masters.tenantPriceMap[sel.workItem.id];
        const unit = price?.unit ?? sel.workItem.default_unit ?? item.unit;
        const unitPrice = price?.unit_price ?? item.unit_price;
        return recalc({
          ...item,
          category: sel.category,
          work_item_id: sel.workItem.id,
          name: sel.workItem.name,
          unit: unit || item.unit,
          unit_price: unitPrice,
          description: item.description || sel.workItem.default_description || "",
        });
      }),
    );
  };

  const addItem = () => setItems((prev) => [...prev, emptyItem()]);
  const removeItem = (index: number) =>
    setItems((prev) => (prev.length === 1 ? prev : prev.filter((_, i) => i !== index)));

  const tenantSubtotal = items.reduce((sum, item) => sum + item.tenant_amount, 0);
  const landlordTotal = items.reduce(
    (sum, item) => sum + (item.landlord_amount ?? item.amount - item.tenant_amount),
    0,
  );
  const tax = Math.floor(tenantSubtotal * 0.1);
  const grossTotal = tenantSubtotal + tax;
  const received = (depositAmount || 0) + (prepaidAmount || 0);
  const balance = grossTotal - received - (depositOffset || 0);

  const handleSave = async () => {
    if (items.some((item) => !item.name)) {
      setError("工事項目名を入力してください（区分→項目を選ぶか、直接入力できます）");
      return;
    }
    setError(null);
    setSaving(true);
    const supabase = createClient();

    const invoiceNumber =
      existing?.invoice_number ??
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
        signatureDataUrl={signature}
      />,
    ).toBlob();

    const pdfPath = `tenant_invoices/${jobId}/${invoiceNumber}.pdf`;
    const uploadResult = await uploadFile("pdfs", pdfPath, blob, "application/pdf");

    if (uploadResult.error) {
      setError(`PDF アップロードに失敗しました: ${uploadResult.error.message}`);
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
      tenant_signature: signature,
    };

    if (existing?.id) {
      const { error: updateError } = await supabase
        .from("tenant_invoices")
        .update(payload)
        .eq("id", existing.id);
      if (updateError) {
        setError(`保存失敗: ${updateError.message}`);
        setSaving(false);
        return;
      }
    } else {
      const { error: insertError } = await supabase
        .from("tenant_invoices")
        .insert([{ job_id: jobId, invoice_number: invoiceNumber, ...payload }]);
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
            {existing ? "入居者請求書を編集" : "入居者請求書を作成"}
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
              <p className="text-slate-500">入居者名</p>
              <p className="mt-1 font-medium text-slate-900">{tenantName || "（未設定）"}</p>
            </div>
          </div>

          <div>
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-medium text-slate-700">工事明細（入居者負担割合入力）</p>
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

                  <div className="grid grid-cols-3 gap-2 rounded-xl bg-panel/60 p-2">
                    <label className="block">
                      <span className="mb-1 block text-xs text-slate-500">入居者負担%</span>
                      <Input
                        type="number"
                        inputMode="numeric"
                        step="5"
                        min={0}
                        max={100}
                        className="bg-white text-right"
                        value={item.ratio}
                        onChange={(e) =>
                          updateItem(index, { ratio: parseFloat(e.target.value) || 0 })
                        }
                      />
                    </label>
                    <div className="block">
                      <span className="mb-1 block text-xs text-slate-500">入居者負担</span>
                      <p className="px-1 py-2.5 text-right text-sm font-semibold text-slate-900">
                        {yen(item.tenant_amount)}
                      </p>
                    </div>
                    <div className="block">
                      <span className="mb-1 block text-xs text-slate-500">賃貸人負担</span>
                      <p className="px-1 py-2.5 text-right text-sm text-slate-500">
                        {yen(item.landlord_amount ?? item.amount - item.tenant_amount)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2 rounded-xl border border-line bg-panel p-4 text-sm">
              <p className="font-medium text-slate-700">負担区分サマリー</p>
              <div className="flex justify-between text-slate-600">
                <span>入居者負担合計（税抜）</span>
                <span className="font-medium text-slate-900">{yen(tenantSubtotal)}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>賃貸人負担合計（オーナー処理・参考）</span>
                <span>{yen(landlordTotal)}</span>
              </div>
              <p className="text-xs text-slate-400">
                ※賃貸人負担分は本請求には含まれません（オーナー様処理の参考値）。
              </p>
            </div>

            <div className="space-y-2 rounded-xl border border-line bg-panel p-4 text-sm">
              <div className="flex justify-between text-slate-600">
                <span>入居者負担小計</span>
                <span>{yen(tenantSubtotal)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>消費税（10%）</span>
                <span>{yen(tax)}</span>
              </div>
              <div className="flex justify-between font-medium text-slate-900">
                <span>入居者負担合計（税込）</span>
                <span>{yen(grossTotal)}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>敷金</span>
                <span>△{yen(depositAmount || 0)}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>前払い金</span>
                <span>△{yen(prepaidAmount || 0)}</span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="shrink-0 text-slate-500">その他相殺額</span>
                <Input
                  type="number"
                  inputMode="numeric"
                  step="1"
                  min={0}
                  className="w-32 text-right"
                  value={depositOffset}
                  onChange={(e) => setDepositOffset(parseFloat(e.target.value) || 0)}
                />
              </div>
              <div
                className={`flex justify-between border-t border-line pt-2 text-base font-semibold ${
                  balance >= 0 ? "text-slate-900" : "text-emerald-700"
                }`}
              >
                <span>{balance >= 0 ? "ご請求額（税込）" : "ご返金額（税込）"}</span>
                <span>{yen(Math.abs(balance))}</span>
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

          <div className="rounded-xl border border-line p-4">
            <SignaturePad value={signature} onChange={setSignature} title="入居者サイン" />
            <p className="mt-2 text-xs text-slate-400">
              入居者に画面上でサインしてもらい「サインを確定」を押してください。サインなしでも保存できます。
            </p>
          </div>

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
