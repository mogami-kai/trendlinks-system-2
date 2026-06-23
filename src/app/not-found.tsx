import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="text-3xl font-bold text-brand-700">404</h1>
      <p className="text-sm text-slate-500">ページが見つかりませんでした。</p>
      <Link href="/dashboard" className="btn-primary">
        ダッシュボードへ
      </Link>
    </div>
  );
}
