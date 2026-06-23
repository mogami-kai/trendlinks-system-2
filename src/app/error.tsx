"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="text-2xl font-bold">エラーが発生しました</h1>
      <p className="max-w-md text-sm text-slate-500">{error.message}</p>
      <button onClick={reset} className="btn-primary">
        再試行
      </button>
    </div>
  );
}
