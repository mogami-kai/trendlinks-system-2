"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function SignupPage() {
  const router = useRouter();
  const [company, setCompany] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const supabase = createClient();

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
        data: { full_name: name, company_name: company },
      },
    });
    if (error) {
      setLoading(false);
      return setError(error.message);
    }

    // メール確認なしでセッションが張られた場合はテナント作成
    if (data.session) {
      const { error: rpcErr } = await supabase.rpc("create_tenant_and_owner", {
        company,
        owner_name: name,
      });
      setLoading(false);
      if (rpcErr) return setError(rpcErr.message);
      router.push("/dashboard");
      router.refresh();
      return;
    }

    setLoading(false);
    setMessage(
      "確認メールを送信しました。メール内のリンクから登録を完了してください。"
    );
  }

  return (
    <div className="card">
      <h1 className="mb-4 text-xl font-bold">新規登録</h1>
      {error && (
        <p className="mb-3 rounded bg-red-50 p-2 text-sm text-red-600">{error}</p>
      )}
      {message ? (
        <p className="rounded bg-brand-50 p-3 text-sm text-brand-700">{message}</p>
      ) : (
        <form onSubmit={onSubmit} className="space-y-3">
          <div>
            <label className="label">会社名</label>
            <input
              className="input"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="label">お名前</label>
            <input
              className="input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
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
              minLength={8}
              required
            />
          </div>
          <button className="btn-primary w-full" disabled={loading}>
            {loading ? "登録中..." : "無料で始める"}
          </button>
        </form>
      )}
      <p className="mt-4 text-center text-sm">
        すでにアカウントをお持ちですか？{" "}
        <Link href="/login" className="text-brand-600 hover:underline">
          ログイン
        </Link>
      </p>
      <p className="mt-3 text-center text-xs text-slate-400">
        登録により
        <Link href="/legal/terms" className="underline">
          利用規約
        </Link>
        ・
        <Link href="/legal/privacy" className="underline">
          プライバシーポリシー
        </Link>
        に同意したものとみなします。
      </p>
    </div>
  );
}
