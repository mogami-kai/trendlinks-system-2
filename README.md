# trendlinks-system-2

清掃業・ビルメンテナンス・ハウスクリーニング業界向けの現場管理 SaaS
（Trendlinks 同等システム）を新規構築するためのリポジトリ。

現時点では**要件定義書一式**を整備している。

📄 **要件定義書: [`docs/requirements/`](./docs/requirements/README.md)**

## 概要
- 主機能: 現場管理 / 作業指示 / LINE 配信 / 現場報告+写真 / GPS 到着確認 / 顧客報告書 PDF 自動生成
- 提供形態: サブスクリプション（3 プラン）・マルチテナント
- 技術構成: Next.js 14 + Supabase（Auth/DB/Storage）+ Vercel（実デプロイ準拠）

詳細は [要件定義書](./docs/requirements/README.md) を参照。
