import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Trendlinks — 清掃現場管理SaaS",
  description:
    "清掃・ビルメンテナンス・ハウスクリーニング業向けの現場管理SaaS。現場管理・作業指示・現場報告・GPS到着確認・顧客報告書PDF自動生成をスマホ完結で。",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
