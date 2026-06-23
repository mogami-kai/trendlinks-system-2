"use client";

import { useState } from "react";

export function DispatchButton({ workOrderId }: { workOrderId: string }) {
  const [state, setState] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function dispatch() {
    setLoading(true);
    setState(null);
    try {
      const res = await fetch(`/api/work-orders/${workOrderId}/dispatch`, {
        method: "POST",
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message || "配信に失敗しました");
      setState(
        `配信完了: 成功 ${json.success} / 失敗 ${json.failed} / スキップ ${json.skipped}`
      );
    } catch (e) {
      setState((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <button onClick={dispatch} className="btn-secondary" disabled={loading}>
        {loading ? "配信中..." : "LINEで再配信"}
      </button>
      {state && <p className="mt-2 text-sm text-slate-600">{state}</p>}
    </div>
  );
}
