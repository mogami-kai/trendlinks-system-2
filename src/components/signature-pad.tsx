"use client";

import { useEffect, useRef, useState } from "react";
import type ReactSignatureCanvas from "react-signature-canvas";

import { Button } from "@/components/ui";

type Props = {
  value: string | null;
  onChange: (dataUrl: string | null) => void;
  disabled?: boolean;
  title?: string;
};

export function SignaturePad({ value, onChange, disabled, title = "入居者サイン" }: Props) {
  const [SignatureCanvas, setSignatureCanvas] = useState<typeof ReactSignatureCanvas | null>(null);
  const sigRef = useRef<ReactSignatureCanvas | null>(null);
  const [locked, setLocked] = useState(Boolean(value));

  useEffect(() => {
    void import("react-signature-canvas").then((mod) => {
      setSignatureCanvas(() => mod.default);
    });
  }, []);

  useEffect(() => {
    if (!locked && sigRef.current) {
      sigRef.current.clear();
    }
  }, [locked]);

  const handleConfirm = () => {
    if (!sigRef.current) return;
    if (sigRef.current.isEmpty()) {
      alert("サインを入力してください");
      return;
    }
    const dataUrl = sigRef.current.toDataURL("image/png");
    setLocked(true);
    onChange(dataUrl);
  };

  const handleRewrite = () => {
    setLocked(false);
    onChange(null);
  };

  const handleClear = () => {
    sigRef.current?.clear();
  };

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <p className="text-sm font-medium text-slate-700">{title}</p>
        {!locked && !disabled && (
          <button
            type="button"
            onClick={handleClear}
            className="rounded-lg px-3 py-1.5 text-sm text-slate-500 hover:bg-slate-100"
          >
            クリア
          </button>
        )}
        {locked && (
          <span className="inline-flex items-center rounded-full bg-green-50 px-2.5 py-1 text-xs font-medium text-green-700">
            ✓ サイン取得済み
          </span>
        )}
      </div>

      <div className="overflow-hidden rounded-xl border border-line bg-slate-50" style={{ height: 160 }}>
        {locked && value ? (
          <img
            src={value}
            alt="署名"
            className="h-full w-full object-contain"
          />
        ) : SignatureCanvas ? (
          <SignatureCanvas
            ref={(ref) => { sigRef.current = ref; }}
            penColor="#1e293b"
            canvasProps={{
              className: "w-full h-full",
              style: { width: "100%", height: 160 },
            }}
            backgroundColor="rgb(248,250,252)"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-slate-400">
            読み込み中...
          </div>
        )}
      </div>

      {!locked && !disabled && (
        <div className="mt-2 flex justify-end">
          <Button type="button" onClick={handleConfirm}>
            サインを確定
          </Button>
        </div>
      )}

      {locked && !disabled && (
        <div className="mt-2 flex justify-end">
          <Button type="button" variant="secondary" onClick={handleRewrite}>
            書き直し
          </Button>
        </div>
      )}
    </div>
  );
}
