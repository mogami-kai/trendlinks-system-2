"use client";

import { useState } from "react";

export function PdfActions({
  reportId,
  customerEmail,
}: {
  reportId: string;
  customerEmail?: string | null;
}) {
  const [msg, setMsg] = useState<string | null>(null);
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function generate() {
    setLoading(true);
    setMsg(null);
    try {
      const res = await fetch(`/api/reports/${reportId}/pdf`, { method: "POST" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message || "生成に失敗しました");
      setUrl(json.url);
      setMsg("PDFを生成しました。");
    } catch (e) {
      setMsg((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function send() {
    setLoading(true);
    setMsg(null);
    try {
      const res = await fetch(`/api/reports/${reportId}/pdf/send`, { method: "POST" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message || "送付に失敗しました");
      setMsg(`顧客 (${json.to}) へPDFを送付しました。`);
    } catch (e) {
      setMsg((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        <button onClick={generate} className="btn-primary" disabled={loading}>
          {loading ? "処理中..." : "PDFを生成"}
        </button>
        {url && (
          <a href={url} target="_blank" rel="noreferrer" className="btn-secondary">
            PDFを開く
          </a>
        )}
        <button onClick={send} className="btn-secondary" disabled={loading || !customerEmail}>
          顧客へ送付
        </button>
      </div>
      {!customerEmail && (
        <p className="text-xs text-amber-700">
          現場に取引先メールが未設定のため送付できません。
        </p>
      )}
      {msg && <p className="text-sm text-slate-600">{msg}</p>}
    </div>
  );
}
