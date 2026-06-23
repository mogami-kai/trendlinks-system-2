"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { createReportWithPhotos } from "@/app/(app)/reports/actions";

export default function ReportCreatePage() {
  const params = useParams();
  const id = params.id as string;
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const picked = Array.from(e.target.files || []);
    const merged = [...files, ...picked].slice(0, 5);
    setFiles(merged);
  }

  function removeAt(i: number) {
    setFiles(files.filter((_, idx) => idx !== i));
  }

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="mb-5 text-xl font-bold">現場報告</h1>
      {error && <p className="mb-3 rounded bg-red-50 p-2 text-sm text-red-600">{error}</p>}
      <form
        action={async (fd) => {
          setPending(true);
          setError(null);
          fd.delete("photos");
          files.forEach((f) => fd.append("photos", f));
          fd.set("work_order_id", id);
          try {
            await createReportWithPhotos(fd);
          } catch (e) {
            setError((e as Error).message);
            setPending(false);
          }
        }}
        className="space-y-4"
      >
        <div>
          <label className="label">完了コメント</label>
          <textarea name="comment" rows={4} className="input" placeholder="作業内容・特記事項" />
        </div>

        <div>
          <label className="label">写真（最大5枚） {files.length}/5</label>
          <input
            type="file"
            accept="image/*"
            capture="environment"
            multiple
            onChange={onPick}
            disabled={files.length >= 5}
            className="input"
          />
          <div className="mt-3 grid grid-cols-3 gap-2">
            {files.map((f, i) => (
              <div key={i} className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={URL.createObjectURL(f)}
                  alt={`photo-${i}`}
                  className="h-24 w-full rounded object-cover"
                />
                <button
                  type="button"
                  onClick={() => removeAt(i)}
                  className="absolute right-1 top-1 rounded-full bg-black/60 px-2 text-xs text-white"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>

        <button className="btn-primary w-full" disabled={pending}>
          {pending ? "送信中..." : "報告を提出する"}
        </button>
      </form>
    </div>
  );
}
