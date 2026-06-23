"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="card">読み込み中...</div>}>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const redirect = params.get("redirect") || "/dashboard";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) return setError(error.message);
    router.push(redirect);
    router.refresh();
  }

  async function googleLogin() {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${redirect}`,
      },
    });
  }

  return (
    <div className="card">
      <h1 className="mb-4 text-xl font-bold">ログイン</h1>
      {error && (
        <p className="mb-3 rounded bg-red-50 p-2 text-sm text-red-600">{error}</p>
      )}
      <form onSubmit={onSubmit} className="space-y-3">
        <div>
          <label className="label">メールアドレス</label>
          <input
            type="email"
            className="input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="label">パスワード</label>
          <input
            type="password"
            className="input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <button className="btn-primary w-full" disabled={loading}>
          {loading ? "ログイン中..." : "ログイン"}
        </button>
      </form>
      <button onClick={googleLogin} className="btn-secondary mt-3 w-full">
        Google でログイン
      </button>
      <div className="mt-4 flex justify-between text-sm">
        <Link href="/reset-password" className="text-brand-600 hover:underline">
          パスワードをお忘れですか？
        </Link>
        <Link href="/signup" className="text-brand-600 hover:underline">
          新規登録
        </Link>
      </div>
    </div>
  );
}
