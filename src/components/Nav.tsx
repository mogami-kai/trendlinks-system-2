"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/dashboard", label: "ホーム", icon: "🏠" },
  { href: "/my/tasks", label: "自分の作業", icon: "📝" },
  { href: "/sites", label: "現場", icon: "📍" },
  { href: "/work-orders", label: "作業指示", icon: "📋" },
  { href: "/reports", label: "報告", icon: "📷" },
  { href: "/settings", label: "設定", icon: "⚙️" },
];

export function Sidebar({
  companyName,
  role,
}: {
  companyName: string;
  role: string;
}) {
  const pathname = usePathname();
  return (
    <aside className="hidden w-60 shrink-0 flex-col border-r border-slate-200 bg-white p-4 md:flex">
      <div className="mb-6">
        <div className="text-lg font-bold text-brand-700">Trendlinks</div>
        <div className="mt-1 truncate text-xs text-slate-500">{companyName}</div>
      </div>
      <nav className="flex-1 space-y-1">
        {items.map((it) => {
          const active = pathname.startsWith(it.href);
          return (
            <Link
              key={it.href}
              href={it.href}
              className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm ${
                active
                  ? "bg-brand-50 font-medium text-brand-700"
                  : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              <span>{it.icon}</span>
              {it.label}
            </Link>
          );
        })}
        {(role === "owner" || role === "admin") && (
          <>
            <Link
              href="/customers"
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-slate-50"
            >
              <span>🤝</span>取引先
            </Link>
            <Link
              href="/staff"
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-slate-50"
            >
              <span>👥</span>スタッフ
            </Link>
            <Link
              href="/billing"
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-slate-50"
            >
              <span>💳</span>プラン・決済
            </Link>
          </>
        )}
      </nav>
      <form action="/auth/signout" method="post">
        <button className="btn-secondary mt-4 w-full">ログアウト</button>
      </form>
    </aside>
  );
}

export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-10 flex border-t border-slate-200 bg-white md:hidden">
      {items.map((it) => {
        const active = pathname.startsWith(it.href);
        return (
          <Link
            key={it.href}
            href={it.href}
            className={`flex flex-1 flex-col items-center py-2 text-xs ${
              active ? "text-brand-700" : "text-slate-500"
            }`}
          >
            <span className="text-lg">{it.icon}</span>
            {it.label}
          </Link>
        );
      })}
    </nav>
  );
}
