"use client";

import { useState } from "react";
import { setStaffRole, setStaffActive } from "./actions";

export function StaffControls({
  id,
  role,
  active,
}: {
  id: string;
  role: "owner" | "admin" | "staff";
  active: boolean;
}) {
  const [pending, setPending] = useState(false);

  async function changeRole(value: string) {
    if (value === "owner") return;
    setPending(true);
    try {
      await setStaffRole(id, value as "admin" | "staff");
    } finally {
      setPending(false);
    }
  }

  async function toggle() {
    setPending(true);
    try {
      await setStaffActive(id, !active);
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      {role === "owner" ? (
        <span className="badge bg-slate-100 text-slate-600">owner</span>
      ) : (
        <select
          className="input max-w-[110px] py-1"
          value={role}
          onChange={(e) => changeRole(e.target.value)}
          disabled={pending}
        >
          <option value="admin">管理者</option>
          <option value="staff">スタッフ</option>
        </select>
      )}
      <button
        onClick={toggle}
        className="text-sm text-slate-600 hover:underline"
        disabled={pending || role === "owner"}
      >
        {active ? "無効化" : "有効化"}
      </button>
    </div>
  );
}
