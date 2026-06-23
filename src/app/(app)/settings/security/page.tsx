"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface Factor {
  id: string;
  status: string;
  friendly_name?: string;
}

export default function SecurityPage() {
  const supabase = createClient();
  const [factors, setFactors] = useState<Factor[]>([]);
  const [qr, setQr] = useState<string | null>(null);
  const [factorId, setFactorId] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function refresh() {
    const { data } = await supabase.auth.mfa.listFactors();
    setFactors((data?.totp as Factor[]) || []);
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function enroll() {
    setLoading(true);
    setMsg(null);
    const { data, error } = await supabase.auth.mfa.enroll({ factorType: "totp" });
    setLoading(false);
    if (error) return setMsg(error.message);
    setFactorId(data.id);
    setQr(data.totp.qr_code);
  }

  async function verify() {
    if (!factorId) return;
    setLoading(true);
    setMsg(null);
    const { data: challenge, error: cErr } = await supabase.auth.mfa.challenge({
      factorId,
    });
    if (cErr) {
      setLoading(false);
      return setMsg(cErr.message);
    }
    const { error } = await supabase.auth.mfa.verify({
      factorId,
      challengeId: challenge.id,
      code,
    });
    setLoading(false);
    if (error) return setMsg(error.message);
    setMsg("2要素認証を有効化しました。");
    setQr(null);
    setFactorId(null);
    setCode("");
    refresh();
  }

  async function unenroll(id: string) {
    setLoading(true);
    await supabase.auth.mfa.unenroll({ factorId: id });
    setLoading(false);
    refresh();
  }

  return (
    <div className="max-w-lg">
      <h1 className="mb-5 text-xl font-bold">セキュリティ・2要素認証</h1>
      {msg && <p className="mb-3 rounded bg-brand-50 p-2 text-sm text-brand-700">{msg}</p>}

      <h2 className="mb-2 text-lg font-semibold">登録済みの認証要素</h2>
      <ul className="space-y-2">
        {factors.length === 0 && (
          <p className="text-sm text-slate-500">2要素認証は未設定です。</p>
        )}
        {factors.map((f) => (
          <li key={f.id} className="card flex items-center justify-between">
            <span className="text-sm">
              TOTP（{f.status === "verified" ? "有効" : "未確認"}）
            </span>
            <button
              onClick={() => unenroll(f.id)}
              className="text-sm text-red-600 hover:underline"
              disabled={loading}
            >
              解除
            </button>
          </li>
        ))}
      </ul>

      <div className="mt-6">
        {!qr ? (
          <button onClick={enroll} className="btn-primary" disabled={loading}>
            認証アプリ (TOTP) を追加
          </button>
        ) : (
          <div className="card space-y-3">
            <p className="text-sm text-slate-600">
              認証アプリで QR コードを読み取り、表示された 6 桁コードを入力してください。
            </p>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={qr} alt="TOTP QR" className="h-44 w-44" />
            <input
              className="input"
              placeholder="6桁コード"
              value={code}
              onChange={(e) => setCode(e.target.value)}
            />
            <button onClick={verify} className="btn-primary w-full" disabled={loading}>
              確認して有効化
            </button>
          </div>
        )}
      </div>

      <p className="mt-6 text-sm text-slate-500">
        パスワード変更は{" "}
        <a href="/update-password" className="text-brand-600 hover:underline">
          こちら
        </a>
        。
      </p>
    </div>
  );
}
