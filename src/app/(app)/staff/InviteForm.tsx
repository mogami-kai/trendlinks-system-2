"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function InviteForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("staff");
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMsg(null);
    try {
      const res = await fetch("/api/staff/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, role }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message || "招待に失敗しました");
      setMsg("招待メールを送信しました。");
      setEmail("");
      router.refresh();
    } catch (e) {
      setMsg((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="card mb-5 grid gap-3 sm:grid-cols-4">
      <input
        type="email"
        placeholder="招待するメールアドレス"
        className="input sm:col-span-2"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      <select className="input" value={role} onChange={(e) => setRole(e.target.value)}>
        <option value="staff">スタッフ</option>
        <option value="admin">管理者</option>
      </select>
      <button className="btn-primary" disabled={loading}>
        {loading ? "送信中..." : "招待する"}
      </button>
      {msg && <p className="text-sm text-slate-600 sm:col-span-4">{msg}</p>}
    </form>
  );
}
