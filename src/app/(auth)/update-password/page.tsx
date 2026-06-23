"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function UpdatePasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });
    if (error) return setError(error.message);
    setDone(true);
    setTimeout(() => router.push("/dashboard"), 1200);
  }

  return (
    <div className="card">
      <h1 className="mb-4 text-xl font-bold">新しいパスワードを設定</h1>
      {error && (
        <p className="mb-3 rounded bg-red-50 p-2 text-sm text-red-600">{error}</p>
      )}
      {done ? (
        <p className="rounded bg-brand-50 p-3 text-sm text-brand-700">
          パスワードを更新しました。ダッシュボードへ移動します…
        </p>
      ) : (
        <form onSubmit={onSubmit} className="space-y-3">
          <div>
            <label className="label">新しいパスワード</label>
            <input
              type="password"
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={8}
              required
            />
          </div>
          <button className="btn-primary w-full">更新する</button>
        </form>
      )}
    </div>
  );
}
