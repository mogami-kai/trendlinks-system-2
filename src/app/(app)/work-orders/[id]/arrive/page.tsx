"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";

export default function ArrivePage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [status, setStatus] = useState<string | null>(null);
  const [result, setResult] = useState<{ arrived: boolean; distance: number } | null>(null);
  const [loading, setLoading] = useState(false);

  function arrive() {
    setLoading(true);
    setStatus(null);
    if (!navigator.geolocation) {
      setLoading(false);
      setStatus("この端末では位置情報を取得できません。");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const res = await fetch("/api/arrivals", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              work_order_id: id,
              lat: pos.coords.latitude,
              lng: pos.coords.longitude,
            }),
          });
          const json = await res.json();
          if (!res.ok) throw new Error(json.error?.message || "記録に失敗しました");
          setResult({ arrived: json.is_arrived, distance: json.distance_m });
        } catch (e) {
          setStatus((e as Error).message);
        } finally {
          setLoading(false);
        }
      },
      (err) => {
        setLoading(false);
        setStatus(`位置情報の取得に失敗しました: ${err.message}`);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  return (
    <div className="mx-auto max-w-sm text-center">
      <h1 className="text-xl font-bold">GPS到着確認</h1>
      <p className="mt-2 text-sm text-slate-500">
        現場に到着したらボタンを押してください。現場から200m以内で到着が記録されます。
      </p>

      {result ? (
        <div className="card mt-8">
          <div className="text-5xl">{result.arrived ? "✅" : "⚠️"}</div>
          <p className="mt-3 font-medium">
            {result.arrived ? "到着を記録しました" : "現場から離れています"}
          </p>
          <p className="mt-1 text-sm text-slate-500">
            距離: 約 {Math.round(result.distance)}m
          </p>
          <button
            onClick={() => router.push(`/work-orders/${id}`)}
            className="btn-primary mt-5 w-full"
          >
            作業指示に戻る
          </button>
        </div>
      ) : (
        <button
          onClick={arrive}
          disabled={loading}
          className="btn-primary mt-10 h-32 w-full text-lg"
        >
          {loading ? "確認中..." : "到着を記録する"}
        </button>
      )}

      {status && (
        <p className="mt-4 rounded bg-red-50 p-2 text-sm text-red-600">{status}</p>
      )}
    </div>
  );
}
