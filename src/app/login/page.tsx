"use client";

import { ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { startTransition, useEffect, useState } from "react";

import { Button, Field, Input } from "@/components/ui";
import { createClient } from "@/lib/supabase/browser";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const run = async () => {
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session) {
        startTransition(() => {
          router.replace("/dashboard");
          router.refresh();
        });
      }
    };

    void run();
  }, [router]);

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      setError(signInError.message);
      setLoading(false);
      return;
    }

    startTransition(() => {
      router.replace("/dashboard");
      router.refresh();
    });
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(185,139,67,0.20),transparent_30%),radial-gradient(circle_at_bottom_left,rgba(30,41,59,0.12),transparent_35%)]" />

      <div className="relative grid w-full max-w-5xl overflow-hidden rounded-[32px] border border-white/60 bg-white/85 shadow-[0_40px_120px_rgba(15,23,42,0.12)] backdrop-blur-xl lg:grid-cols-[1.1fr_0.9fr]">
        <div className="border-b border-line px-7 py-8 lg:border-b-0 lg:border-r lg:px-10 lg:py-12">
          <div className="flex items-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand text-white shadow-lg shadow-slate-900/20">
              <ShieldCheck size={24} />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-accent">
                TrendLinks
              </p>
              <h1 className="text-2xl font-semibold text-slate-900">
                原状回復業務管理
              </h1>
            </div>
          </div>

          <div className="mt-8 space-y-5">
            <p className="max-w-xl text-base leading-8 text-slate-600">
              管理会社、物件、号室、案件、写真、帳票、請求・入金までを
              一つの画面系に束ねたバックオフィス用の運用コンソールです。
            </p>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl border border-line bg-panel px-4 py-4">
                <p className="text-xs uppercase tracking-[0.2em] text-accent">
                  Flow
                </p>
                <p className="mt-2 text-sm text-slate-700">
                  管理会社から案件、外注、入金までを一気通貫で追跡
                </p>
              </div>
              <div className="rounded-2xl border border-line bg-panel px-4 py-4">
                <p className="text-xs uppercase tracking-[0.2em] text-accent">
                  Docs
                </p>
                <p className="mt-2 text-sm text-slate-700">
                  見積書、施工依頼書、入居者請求書、PDF 保管に対応
                </p>
              </div>
              <div className="rounded-2xl border border-line bg-panel px-4 py-4">
                <p className="text-xs uppercase tracking-[0.2em] text-accent">
                  Margin
                </p>
                <p className="mt-2 text-sm text-slate-700">
                  月次の売上、外注、粗利、利益率を同じ導線で確認
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="px-7 py-8 lg:px-10 lg:py-12">
          <p className="text-xs uppercase tracking-[0.28em] text-slate-400">
            Sign In
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-900">
            オペレーター認証
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            実機と同じ Supabase 認証でログインします。
          </p>

          <form className="mt-8 space-y-4" onSubmit={onSubmit}>
            <Field label="メールアドレス">
              <Input
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </Field>
            <Field label="パスワード">
              <Input
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
            </Field>

            {error ? (
              <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            ) : null}

            <Button className="w-full py-3" type="submit" disabled={loading}>
              {loading ? "ログイン中..." : "ログイン"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
