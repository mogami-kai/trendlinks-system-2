import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireSession, isAdmin } from "@/lib/auth";

export const runtime = "nodejs";

const SELECTS: Record<string, { table: string; columns: string }> = {
  sites: {
    table: "sites",
    columns: "id,name,prefecture,city,address_line,building,lat,lng,status,created_at",
  },
  "work-orders": {
    table: "work_orders",
    columns: "id,site_id,scheduled_from,scheduled_to,time_range,status,priority,instructions,created_at",
  },
  reports: {
    table: "reports",
    columns: "id,work_order_id,reporter_id,status,comment,reported_at,created_at",
  },
  customers: { table: "customers", columns: "id,name,email,contact,created_at" },
};

function toCsv(rows: Record<string, unknown>[], columns: string[]): string {
  const escape = (v: unknown) => {
    const s = v == null ? "" : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const header = columns.join(",");
  const body = rows.map((r) => columns.map((c) => escape(r[c])).join(",")).join("\n");
  return `${header}\n${body}`;
}

export async function GET(
  _request: Request,
  { params }: { params: { entity: string } }
) {
  const session = await requireSession();
  if (!isAdmin(session.role)) {
    return NextResponse.json(
      { error: { code: "forbidden", message: "権限がありません" } },
      { status: 403 }
    );
  }
  const spec = SELECTS[params.entity];
  if (!spec) {
    return NextResponse.json(
      { error: { code: "bad_entity", message: "未対応のエクスポート対象です" } },
      { status: 400 }
    );
  }

  const supabase = createClient();
  const { data, error } = await supabase.from(spec.table).select(spec.columns);
  if (error) {
    return NextResponse.json(
      { error: { code: "error", message: error.message } },
      { status: 500 }
    );
  }

  const columns = spec.columns.split(",");
  const csv = toCsv((data as unknown as Record<string, unknown>[]) || [], columns);

  return new NextResponse("﻿" + csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${params.entity}-${Date.now()}.csv"`,
    },
  });
}
