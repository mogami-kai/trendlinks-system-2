# Trendlinks — 清掃現場管理 SaaS

清掃・ビルメンテナンス・ハウスクリーニング業界向けの現場管理 SaaS。
現場管理・作業指示・LINE 配信・現場報告（写真）・GPS 到着確認・顧客報告書 PDF 自動生成を
スマホ完結で提供する。マルチテナント / サブスクリプション課金対応。

- 📄 要件定義書: [`docs/requirements/`](./docs/requirements/README.md)
- ✅ **セットアップ手順（あなたにしかできない作業）: [`docs/SETUP_CHECKLIST.md`](./docs/SETUP_CHECKLIST.md)**
- 🧩 技術スタック: **Next.js 14 (App Router) / TypeScript / Tailwind CSS / Supabase / Stripe / Vercel**

## 主な機能

| 機能 | 説明 | プラン |
|---|---|---|
| 認証・マルチテナント | Email/パスワード・Google・パスワードリセット・招待（Supabase Auth + RLS） | 全 |
| 現場管理 (Site) | 現場・住所・担当・契約・緯度経度の CRUD | 全 |
| 作業指示 (WorkOrder) | 現場別/スタッフ別/日程フィルタ・担当割当・ステータス | 全 |
| LINE 作業指示配信 | 担当スタッフへ Push 配信・配信ログ | 全 |
| 現場報告 + 写真 | スマホ完了報告・写真最大 5 枚（Supabase Storage） | 全 |
| GPS 到着確認 | haversine 200m 判定で到着自動記録 | Pro |
| 顧客報告書 PDF | 1 クリックで PDF 生成・顧客へメール送付 | Pro |
| サブスク決済 | Stripe 3 プラン・上限/機能ゲート・Webhook 同期 | — |

## ディレクトリ構成

```
src/app/(public)         ランディング / 法務4ページ (/legal/*)
src/app/(auth)           ログイン・登録・パスワードリセット
src/app/(app)            認証後アプリ (dashboard/sites/work-orders/reports/...)
src/app/api              Route Handlers (arrivals/dispatch/pdf/billing/webhooks/...)
src/lib                  supabase clients / plans / haversine / line / brevo / stripe / pdf
supabase/migrations      DB スキーマ + RLS ポリシー
```

## セットアップ

### 1. 依存インストール
```bash
npm install
```

### 2. Supabase
1. Supabase プロジェクトを作成。
2. `supabase/migrations/0001_init.sql` → `0002_policies.sql` を SQL エディタで実行
   （または Supabase CLI で `supabase db push`）。
3. Storage バケットを 2 つ作成（いずれも Private）:
   - `report-photos`（現場写真）
   - `pdf-reports`（生成 PDF）
4. Auth プロバイダで **Google** を有効化し、リダイレクトに `/auth/callback` を登録。
5. （任意）Auth の SMTP に Brevo を設定。

### 3. 環境変数
`.env.example` をコピーして `.env.local` を作成し、各値を設定:
```bash
cp .env.example .env.local
```

### 4. 起動
```bash
npm run dev      # http://localhost:3000
npm run build    # 本番ビルド
npm run lint     # ESLint
npm run typecheck
```

### 5. Stripe
1. Starter / Pro の Price を作成し `STRIPE_PRICE_STARTER` / `STRIPE_PRICE_PRO` に設定。
2. Webhook エンドポイント `/(本番URL)/api/webhooks/stripe` を登録し
   `STRIPE_WEBHOOK_SECRET` を設定。

### 6. デプロイ (Vercel)
- GitHub 連携でインポートし、`.env.example` のキーを環境変数に登録。
- `NEXT_PUBLIC_APP_URL` を本番ドメインに設定。

## 必要な外部連携（コネクタ）

| サービス | 用途 | 必要なもの |
|---|---|---|
| **Supabase** | 認証 / DB(RLS) / Storage | URL・anon key・service_role key・バケット2つ・migration適用 |
| **Stripe** | サブスク決済 | secret/publishable key・Webhook secret・Price ID×2 |
| **LINE Messaging API** | 作業指示配信 | channel access token・channel secret |
| **Brevo** | メール送信(PDF/通知) | API key・差出人(MAIL_FROM)・ドメイン認証 |
| **Google Cloud** | Google ログイン | OAuth client ID/secret（Supabase に登録） |
| **Vercel** | ホスティング | プロジェクト・環境変数・本番ドメイン |

## 注意

- 本リポジトリは MVP 実装。外部サービスは環境変数に対してコーディングされており、
  実値投入後に動作する（本開発環境からは外部サービスへ到達不可のため未接続）。
- PDF の日本語表示には日本語フォントが必要（`PDF_FONT_URL` で指定可、既定は Noto Sans JP）。
- データモデル / 画面は要件定義（`docs/requirements/`）に基づく。実機調査での確定は未実施。
