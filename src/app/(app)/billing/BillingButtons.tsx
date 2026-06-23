"use client";

import { useState } from "react";
import type { Plan } from "@/lib/plans";

export function CheckoutButton({ plan, label }: { plan: Plan; label: string }) {
  const [loading, setLoading] = useState(false);
  async function go() {
    setLoading(true);
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      const json = await res.json();
      if (json.url) window.location.href = json.url;
      else alert(json.error?.message || "エラーが発生しました");
    } finally {
      setLoading(false);
    }
  }
  return (
    <button onClick={go} className="btn-primary w-full" disabled={loading}>
      {loading ? "処理中..." : label}
    </button>
  );
}

export function PortalButton() {
  const [loading, setLoading] = useState(false);
  async function go() {
    setLoading(true);
    try {
      const res = await fetch("/api/billing/portal", { method: "POST" });
      const json = await res.json();
      if (json.url) window.location.href = json.url;
      else alert(json.error?.message || "エラーが発生しました");
    } finally {
      setLoading(false);
    }
  }
  return (
    <button onClick={go} className="btn-secondary" disabled={loading}>
      {loading ? "処理中..." : "プラン変更・解約 (カスタマーポータル)"}
    </button>
  );
}
