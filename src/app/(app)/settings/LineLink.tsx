"use client";

import { useState } from "react";
import { createLineLinkCode } from "./lineActions";

export function LineLink({ linked }: { linked: boolean }) {
  const [code, setCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function generate() {
    setLoading(true);
    try {
      setCode(await createLineLinkCode());
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card">
      <div className="mb-2 text-sm">
        ステータス:{" "}
        {linked ? (
          <span className="badge bg-brand-100 text-brand-700">連携済み</span>
        ) : (
          <span className="badge bg-slate-100 text-slate-600">未連携</span>
        )}
      </div>
      <p className="text-sm text-slate-600">
        会社の LINE 公式アカウントを友だち追加し、下のコードをトークに送信すると、
        作業指示が LINE に届くようになります。
      </p>
      {code ? (
        <div className="mt-3">
          <div className="rounded-lg bg-slate-900 py-3 text-center text-2xl font-bold tracking-widest text-white">
            {code}
          </div>
          <p className="mt-2 text-xs text-slate-500">
            ※ 30分間有効。このコードを LINE トークに送信してください。
          </p>
        </div>
      ) : (
        <button onClick={generate} className="btn-primary mt-3" disabled={loading}>
          {loading ? "発行中..." : "連携コードを発行"}
        </button>
      )}
    </div>
  );
}
