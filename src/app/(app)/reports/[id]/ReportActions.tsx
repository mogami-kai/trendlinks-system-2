"use client";

import { useState } from "react";
import { setReportStatus } from "../actions";

export function ReportActions({ id }: { id: string }) {
  const [pending, setPending] = useState(false);

  async function act(status: "approved" | "rejected") {
    setPending(true);
    await setReportStatus(id, status);
    setPending(false);
  }

  return (
    <div className="flex gap-2">
      <button onClick={() => act("approved")} className="btn-primary" disabled={pending}>
        承認
      </button>
      <button onClick={() => act("rejected")} className="btn-secondary" disabled={pending}>
        差戻し
      </button>
    </div>
  );
}
