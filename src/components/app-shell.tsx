"use client";

import { Menu, ShieldCheck, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
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
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    setMobileNavOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!mobileNavOpen) {
      return;
    }
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMobileNavOpen(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [mobileNavOpen]);

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
                  "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition-[color,background-color,box-shadow] active:translate-y-px",
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
            <div className="flex min-w-0 items-center gap-3">
              <button
                type="button"
                onClick={() => setMobileNavOpen(true)}
                aria-label="メニューを開く"
                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-line bg-white text-slate-600 hover:border-line-strong hover:text-slate-900 active:translate-y-px md:hidden"
              >
                <Menu size={20} />
              </button>
              <div className="min-w-0">
                <p className="text-[11px] font-medium uppercase tracking-[0.3em] text-accent md:hidden">
                  TrendLinks
                </p>
                <p className="text-xs uppercase tracking-[0.22em] text-accent">
                  Operations Console
                </p>
                <p className="truncate text-sm text-slate-600">
                  原状回復案件の進行、外注、請求、入金を横断管理
                </p>
              </div>
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

        <div
          className={clsx(
            "fixed inset-0 z-40 md:hidden",
            mobileNavOpen ? "pointer-events-auto" : "pointer-events-none",
          )}
          aria-hidden={!mobileNavOpen}
        >
          <button
            type="button"
            tabIndex={mobileNavOpen ? 0 : -1}
            aria-label="メニューを閉じる"
            onClick={() => setMobileNavOpen(false)}
            className={clsx(
              "absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity duration-200",
              mobileNavOpen ? "opacity-100" : "opacity-0",
            )}
          />

          <aside
            className={clsx(
              "absolute inset-y-0 left-0 flex w-[82%] max-w-xs flex-col border-r border-line bg-white shadow-2xl transition-transform duration-200 will-change-transform",
              mobileNavOpen ? "translate-x-0" : "-translate-x-full",
            )}
          >
            <div className="flex items-center justify-between border-b border-line px-5 py-5">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand text-white shadow-lg shadow-slate-900/15">
                  <ShieldCheck size={20} />
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-[0.25em] text-accent">
                    TrendLinks
                  </p>
                  <h2 className="text-base font-semibold text-slate-900">
                    原状回復業務管理
                  </h2>
                </div>
              </div>
              <button
                type="button"
                aria-label="メニューを閉じる"
                onClick={() => setMobileNavOpen(false)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-line text-slate-500 hover:border-line-strong hover:text-slate-900 active:translate-y-px"
              >
                <X size={18} />
              </button>
            </div>

            <nav className="flex-1 space-y-1 overflow-y-auto px-4 py-5">
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
                      "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition-[color,background-color,box-shadow] active:translate-y-px",
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
              <p className="truncate text-sm font-medium text-slate-800">
                {email}
              </p>
              <p className="mt-1 text-xs text-slate-500">認証済みオペレーター</p>
            </div>
          </aside>
        </div>

        <main className="mx-auto w-full max-w-[1480px] flex-1 px-4 py-6 md:px-8 md:py-8">
          {children}
        </main>
      </div>
    </div>
  );
};
