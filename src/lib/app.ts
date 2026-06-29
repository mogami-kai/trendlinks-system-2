import {
  Briefcase,
  Building2,
  CalendarDays,
  Calculator,
  House,
  ImageIcon,
  LayoutDashboard,
  Settings,
  Users,
} from "lucide-react";

import type { JobStatus } from "@/lib/types";

export const navItems = [
  { href: "/dashboard", label: "ダッシュボード", icon: LayoutDashboard },
  { href: "/dashboard/companies", label: "管理会社", icon: Building2 },
  { href: "/dashboard/properties", label: "物件", icon: House },
  { href: "/dashboard/contractors", label: "職人", icon: Users },
  { href: "/dashboard/jobs", label: "案件", icon: Briefcase },
  { href: "/dashboard/calendar", label: "カレンダー", icon: CalendarDays },
  { href: "/dashboard/management", label: "管理表", icon: Calculator },
  { href: "/dashboard/photos", label: "写真", icon: ImageIcon },
  { href: "/dashboard/settings", label: "設定", icon: Settings },
] as const;

export const jobStatusOptions: Array<{
  value: JobStatus;
  label: string;
  classes: string;
}> = [
  {
    value: "move_out_received",
    label: "解約受付",
    classes: "bg-slate-200 text-slate-700",
  },
  {
    value: "inspection_scheduled",
    label: "立会予定",
    classes: "bg-sky-100 text-sky-700",
  },
  {
    value: "inspection_done",
    label: "立会完了",
    classes: "bg-cyan-100 text-cyan-700",
  },
  {
    value: "quoted",
    label: "見積済",
    classes: "bg-blue-100 text-blue-700",
  },
  {
    value: "ordered",
    label: "受注",
    classes: "bg-purple-100 text-purple-700",
  },
  {
    value: "in_progress",
    label: "施工中",
    classes: "bg-amber-100 text-amber-800",
  },
  {
    value: "completed",
    label: "施工完了",
    classes: "bg-lime-100 text-lime-800",
  },
  {
    value: "billed",
    label: "請求済",
    classes: "bg-slate-800 text-white",
  },
  {
    value: "paid",
    label: "入金済",
    classes: "bg-green-700 text-white",
  },
];

export const jobStatusMap = Object.fromEntries(
  jobStatusOptions.map((status) => [status.value, status]),
) as Record<JobStatus, (typeof jobStatusOptions)[number]>;

export const jobTypeOptions = [
  "原状回復工事",
  "クレーム対応",
  "ハウスクリーニング",
  "その他",
] as const;

export const settingsCards = [
  {
    href: "/dashboard/settings/company",
    title: "自社情報",
    description: "会社名・登録番号・振込先・印鑑を PDF に反映",
  },
  {
    href: "/dashboard/settings/work-items",
    title: "工事項目マスター",
    description: "見積・請求・施工依頼で使う工事項目を管理",
  },
  {
    href: "/dashboard/settings/prices",
    title: "単価マスター",
    description: "入居者請求用・見積用の単価を設定",
  },
] as const;
