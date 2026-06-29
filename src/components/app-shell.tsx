"use client";

import { ShieldCheck } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { clsx } from "clsx";

import { LogoutButton } from "@/components/logout-button";
import { navItems } from "@/lib/app";

export const AppShell = ({
  children,
  email,
}: {
  children: ReactNode;
  email: string;
}) => {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen bg-transparent">
      <aside className="hidden w-72 shrink-0 border-r border-white/50 bg-white/75 backdrop-blur-xl md:flex md:flex-col">
        <div className="border-b border-line px-6 py-6">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand text-white shadow-lg shadow-slate-900/15">
              <ShieldCheck size={22} />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-accent">
                TrendLinks
              </p>
              <h1 className="text-lg font-semibold text-slate-900">
                原状回復業務管理
              </h1>
            </div>
          </div>
          <p className="mt-3 text-sm text-slate-500">
            管理会社、案件、帳票、粗利を一つの業務動線に統合
          </p>
        </div>

        <nav className="flex-1 space-y-1 px-4 py-5">
          {navItems.map((item) => {
            const active =
              pathname === item.href ||
              (item.href !== "/dashboard" && pathname.startsWith(item.href));
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={clsx(
                  "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium",
                  active
                    ? "bg-brand text-white shadow-md shadow-slate-900/10"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
                )}
              >
                <Icon size={18} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-line px-5 py-4">
          <p className="truncate text-sm font-medium text-slate-800">{email}</p>
          <p className="mt-1 text-xs text-slate-500">認証済みオペレーター</p>
        </div>
      </aside>

      <div className="flex min-h-screen flex-1 flex-col">
        <header className="sticky top-0 z-20 border-b border-white/60 bg-white/78 backdrop-blur-xl">
          <div className="mx-auto flex w-full max-w-[1480px] items-center justify-between gap-4 px-4 py-3 md:px-8">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-[0.3em] text-accent md:hidden">
                TrendLinks
              </p>
              <p className="text-xs uppercase tracking-[0.22em] text-accent">
                Operations Console
              </p>
              <p className="text-sm text-slate-600">
                原状回復案件の進行、外注、請求、入金を横断管理
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="hidden text-right md:block">
                <p className="text-sm font-medium text-slate-800">{email}</p>
                <p className="text-xs text-slate-500">ログイン中</p>
              </div>
              <LogoutButton />
            </div>
          </div>
        </header>

        <div className="border-b border-white/60 bg-white/78 backdrop-blur-xl md:hidden">
          <nav className="thin-scrollbar mx-auto flex w-full max-w-[1480px] gap-2 overflow-x-auto px-4 py-3">
            {navItems.map((item) => {
              const active =
                pathname === item.href ||
                (item.href !== "/dashboard" && pathname.startsWith(item.href));
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={clsx(
                    "inline-flex shrink-0 items-center gap-2 rounded-full border px-3 py-2 text-sm font-medium",
                    active
                      ? "border-brand bg-brand text-white shadow-sm shadow-slate-900/10"
                      : "border-line bg-white text-slate-600",
                  )}
                >
                  <Icon size={16} />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <main className="mx-auto w-full max-w-[1480px] flex-1 px-4 py-6 md:px-8 md:py-8">
          {children}
        </main>
      </div>
    </div>
  );
};
