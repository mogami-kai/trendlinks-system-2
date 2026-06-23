"use client";

import { useState } from "react";
import { updateWorkOrderStatus } from "../actions";

const STATUSES = [
  { value: "todo", label: "未着手" },
  { value: "in_progress", label: "対応中" },
  { value: "done", label: "完了" },
  { value: "confirmed", label: "確認済" },
];

export function StatusControl({
  workOrderId,
  current,
}: {
  workOrderId: string;
  current: string;
}) {
  const [status, setStatus] = useState(current);
  const [saving, setSaving] = useState(false);

  async function onChange(value: string) {
    setStatus(value);
    setSaving(true);
    await updateWorkOrderStatus(workOrderId, value);
    setSaving(false);
  }

  return (
    <select
      className="input max-w-[140px]"
      value={status}
      onChange={(e) => onChange(e.target.value)}
      disabled={saving}
    >
      {STATUSES.map((s) => (
        <option key={s.value} value={s.value}>
          {s.label}
        </option>
      ))}
    </select>
  );
}
