import { format } from "date-fns";
import { ja } from "date-fns/locale";

import { jobStatusMap } from "@/lib/app";
import type { JobStatus } from "@/lib/types";

export const formatCurrency = (value: number | null | undefined) => {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return "-";
  }

  return new Intl.NumberFormat("ja-JP", {
    style: "currency",
    currency: "JPY",
    maximumFractionDigits: 0,
  }).format(value);
};

export const formatDate = (value: string | null | undefined) => {
  if (!value) {
    return "-";
  }

  try {
    return format(new Date(value), "yyyy/MM/dd", { locale: ja });
  } catch {
    return value;
  }
};

export const formatDateTime = (value: string | null | undefined) => {
  if (!value) {
    return "-";
  }

  try {
    return format(new Date(value), "yyyy/MM/dd HH:mm", { locale: ja });
  } catch {
    return value;
  }
};

export const toDateInputValue = (value: string | null | undefined) => {
  if (!value) {
    return "";
  }

  return value.slice(0, 10);
};

export const toDateTimeLocalValue = (value: string | null | undefined) => {
  if (!value) {
    return "";
  }

  return value.slice(0, 16);
};

export const monthInputOptions = (() => {
  const start = new Date(2025, 5, 1);
  const end = new Date(2027, 4, 1);
  const options: string[] = [];
  const cursor = new Date(start);

  while (cursor <= end) {
    options.push(
      `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, "0")}`,
    );
    cursor.setMonth(cursor.getMonth() + 1);
  }

  return options;
})();

export const getStatusLabel = (status: JobStatus | string | null | undefined) =>
  status && status in jobStatusMap
    ? jobStatusMap[status as JobStatus].label
    : status || "-";
