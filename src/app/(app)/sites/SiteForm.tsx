"use client";

import { useState } from "react";

interface Customer {
  id: string;
  name: string;
}

export function SiteForm({
  action,
  customers,
  defaults,
  submitLabel,
}: {
  action: (formData: FormData) => Promise<void>;
  customers: Customer[];
  defaults?: Record<string, any>;
  submitLabel: string;
}) {
  const d = defaults || {};
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lat, setLat] = useState<string>(d.lat ?? "");
  const [lng, setLng] = useState<string>(d.lng ?? "");

  function useCurrentLocation() {
    if (!navigator.geolocation) {
      setError("この端末では位置情報を取得できません。");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude.toFixed(6));
        setLng(pos.coords.longitude.toFixed(6));
      },
      (err) => setError(`位置情報の取得に失敗しました: ${err.message}`),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  return (
    <form
      action={async (fd) => {
        setPending(true);
        setError(null);
        try {
          await action(fd);
        } catch (e) {
          setError((e as Error).message);
          setPending(false);
        }
      }}
      className="space-y-4"
    >
      {error && (
        <p className="rounded bg-red-50 p-2 text-sm text-red-600">{error}</p>
      )}
      <div>
        <label className="label">現場名 *</label>
        <input name="name" className="input" defaultValue={d.name} required />
      </div>
      <div>
        <label className="label">取引先</label>
        <select name="customer_id" className="input" defaultValue={d.customer_id || ""}>
          <option value="">（未設定）</option>
          {customers.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">郵便番号</label>
          <input name="postal_code" className="input" defaultValue={d.postal_code} />
        </div>
        <div>
          <label className="label">都道府県</label>
          <input name="prefecture" className="input" defaultValue={d.prefecture} />
        </div>
      </div>
      <div>
        <label className="label">市区町村</label>
        <input name="city" className="input" defaultValue={d.city} />
      </div>
      <div>
        <label className="label">番地</label>
        <input name="address_line" className="input" defaultValue={d.address_line} />
      </div>
      <div>
        <label className="label">建物名</label>
        <input name="building" className="input" defaultValue={d.building} />
      </div>
      <div>
        <div className="flex items-center justify-between">
          <label className="label">緯度経度 (GPS到着判定用)</label>
          <button
            type="button"
            onClick={useCurrentLocation}
            className="text-xs text-brand-600 hover:underline"
          >
            現在地から取得
          </button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <input
            name="lat"
            type="number"
            step="any"
            placeholder="緯度"
            className="input"
            value={lat}
            onChange={(e) => setLat(e.target.value)}
          />
          <input
            name="lng"
            type="number"
            step="any"
            placeholder="経度"
            className="input"
            value={lng}
            onChange={(e) => setLng(e.target.value)}
          />
        </div>
      </div>
      <div>
        <label className="label">ステータス</label>
        <select name="status" className="input" defaultValue={d.status || "active"}>
          <option value="active">稼働中</option>
          <option value="paused">休止</option>
          <option value="canceled">解約</option>
        </select>
      </div>
      <button className="btn-primary w-full" disabled={pending}>
        {pending ? "保存中..." : submitLabel}
      </button>
    </form>
  );
}
