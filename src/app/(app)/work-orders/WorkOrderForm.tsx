"use client";

import { useState } from "react";

interface Option {
  id: string;
  name: string;
}

export function WorkOrderForm({
  action,
  sites,
  staff,
  defaults,
  defaultAssignees = [],
  submitLabel,
  showDispatch,
}: {
  action: (formData: FormData) => Promise<void>;
  sites: Option[];
  staff: Option[];
  defaults?: Record<string, any>;
  defaultAssignees?: string[];
  submitLabel: string;
  showDispatch?: boolean;
}) {
  const d = defaults || {};
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      {error && <p className="rounded bg-red-50 p-2 text-sm text-red-600">{error}</p>}
      <div>
        <label className="label">現場 *</label>
        <select name="site_id" className="input" defaultValue={d.site_id || ""} required>
          <option value="">選択してください</option>
          {sites.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">開始日</label>
          <input type="date" name="scheduled_from" className="input" defaultValue={d.scheduled_from} />
        </div>
        <div>
          <label className="label">終了日</label>
          <input type="date" name="scheduled_to" className="input" defaultValue={d.scheduled_to} />
        </div>
      </div>
      <div>
        <label className="label">時間帯</label>
        <input name="time_range" className="input" defaultValue={d.time_range} placeholder="例: 09:00-12:00" />
      </div>
      <div>
        <label className="label">担当スタッフ</label>
        <div className="space-y-1 rounded-lg border border-slate-300 p-3">
          {staff.length === 0 && (
            <p className="text-sm text-slate-400">スタッフが登録されていません。</p>
          )}
          {staff.map((s) => (
            <label key={s.id} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="assignee_ids"
                value={s.id}
                defaultChecked={defaultAssignees.includes(s.id)}
              />
              {s.name}
            </label>
          ))}
        </div>
      </div>
      <div>
        <label className="label">作業内容・指示</label>
        <textarea name="instructions" className="input" rows={4} defaultValue={d.instructions} />
      </div>
      <div>
        <label className="label">優先度 (0-5)</label>
        <input type="number" name="priority" min={0} max={5} className="input" defaultValue={d.priority ?? 0} />
      </div>
      {showDispatch && (
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="dispatch" />
          作成と同時に担当スタッフへ LINE 配信する
        </label>
      )}
      <button className="btn-primary w-full" disabled={pending}>
        {pending ? "保存中..." : submitLabel}
      </button>
    </form>
  );
}
