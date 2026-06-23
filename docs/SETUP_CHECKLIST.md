# セットアップ・チェックリスト（あなたにしかできない作業）

このドキュメントの作業を**上から順に**実施すれば、Trendlinks 同等システムを
本番稼働まで再現できます。コードはすべて実装済み（lint/typecheck/test/build 通過済み）で、
残るのは**外部アカウントの作成・キー発行・設定値の投入**のみです。

所要時間目安: 約 2〜4 時間（各サービスの審査待ちを除く）。

凡例: 🔑=キー発行 / ⚙️=管理画面設定 / 💻=コマンド

---

## 0. 事前準備
- [ ] このリポジトリを自分の GitHub にクローン/フォーク
- [ ] ローカルに Node.js 20 以上をインストール
- [ ] 💻 `npm install`
- [ ] 💻 `cp .env.example .env.local`（以降、取得した値を `.env.local` に記入）

---

## 1. Supabase（認証 / DB / ストレージ）★必須
- [ ] ⚙️ [supabase.com](https://supabase.com) でプロジェクトを新規作成（リージョン: Tokyo 推奨）
- [ ] 🔑 Project Settings → API から以下を取得し `.env.local` に記入
  - [ ] `NEXT_PUBLIC_SUPABASE_URL`
  - [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - [ ] `SUPABASE_SERVICE_ROLE_KEY`（**サーバー専用・絶対に公開しない**）
- [ ] ⚙️ SQL Editor で以下を**順番に**実行（DB スキーマ + RLS）
  - [ ] `supabase/migrations/0001_init.sql`
  - [ ] `supabase/migrations/0002_policies.sql`
  - [ ] `supabase/migrations/0003_security_fixes.sql`
  - [ ] `supabase/migrations/0004_line_link_codes.sql`
  - （Supabase CLI 利用時は `supabase db push` でも可）
- [ ] ⚙️ Storage → 新規バケットを 2 つ作成（いずれも **Private**）
  - [ ] `report-photos`（現場写真）
  - [ ] `pdf-reports`（生成PDF）
- [ ] ⚙️ Authentication → Providers → Email を有効化
- [ ] ⚙️ Authentication → MFA → TOTP を有効化（2要素認証用）

## 2. Google OAuth（Googleログイン）★必須
- [ ] ⚙️ [Google Cloud Console](https://console.cloud.google.com) でプロジェクト作成
- [ ] ⚙️ OAuth 同意画面を設定（外部・テスト→公開）
- [ ] 🔑 認証情報 → OAuth クライアントID（ウェブアプリ）を作成
  - 承認済みリダイレクト URI に **Supabase の Callback URL** を追加
    （`https://<project>.supabase.co/auth/v1/callback`）
- [ ] ⚙️ 取得した Client ID / Secret を **Supabase**：Authentication → Providers → Google に登録・有効化

## 3. Stripe（サブスク決済）★必須
- [ ] ⚙️ [Stripe](https://stripe.com) でアカウント作成（まずはテストモード）
- [ ] 🔑 API キーを取得し記入
  - [ ] `STRIPE_SECRET_KEY`
  - [ ] `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- [ ] ⚙️ 商品（Product）と価格（Price・月額・JPY）を 2 つ作成
  - [ ] Starter ¥1,980/月 → Price ID を `STRIPE_PRICE_STARTER` に
  - [ ] Pro ¥4,980/月 → Price ID を `STRIPE_PRICE_PRO` に
- [ ] ⚙️ Webhook エンドポイントを追加
  - URL: `https://<本番ドメイン>/api/webhooks/stripe`
  - 対象イベント: `checkout.session.completed` / `customer.subscription.updated` /
    `customer.subscription.deleted` / `invoice.payment_failed`
  - [ ] 🔑 署名シークレットを `STRIPE_WEBHOOK_SECRET` に
- [ ] （本番化）本番キー・本番 Price ID・本番 Webhook に差し替え（コード変更不要）

## 4. LINE Messaging API（作業指示配信）★必須
- [ ] ⚙️ [LINE Developers](https://developers.line.biz) で Provider → Messaging API チャネル作成
- [ ] 🔑 以下を取得し記入
  - [ ] `LINE_CHANNEL_ACCESS_TOKEN`（長期）
  - [ ] `LINE_CHANNEL_SECRET`
- [ ] ⚙️ Webhook URL に `https://<本番ドメイン>/api/webhooks/line` を設定し**有効化**
      （応答メッセージはOFF推奨。Webhook の利用をON）
- [ ] スタッフ連携は**自動化済み**: スタッフが公式アカウントを友だち追加 →
      アプリ「設定 → LINE連携」で連携コードを発行 → そのコードをLINEトークに送信すると
      `profiles.line_user_id` が自動で紐付く（手動ID入力も可）

## 5. Brevo（メール送信：PDF送付・通知）★必須
- [ ] ⚙️ [Brevo](https://www.brevo.com) でアカウント作成
- [ ] 🔑 API キーを発行し `BREVO_API_KEY` に
- [ ] ⚙️ 差出人ドメインを認証（SPF / DKIM）し、`MAIL_FROM` に差出人を記入
      例: `MAIL_FROM="Trendlinks <no-reply@yourdomain.com>"`
- [ ] （任意）Supabase Authentication → SMTP に Brevo を設定し、認証メールも Brevo 経由に

## 6. PDF 日本語フォント（任意・推奨）
- [ ] ⚙️ 日本語 PDF の文字化け防止に `PDF_FONT_URL` を設定
      （既定は Noto Sans JP の公開URL。社内フォントに差し替え可）

## 7. デプロイ（Vercel）★必須
- [ ] ⚙️ [Vercel](https://vercel.com) でこの GitHub リポジトリをインポート
- [ ] ⚙️ Environment Variables に `.env.example` の全キーを登録（Production/Preview）
  - [ ] `NEXT_PUBLIC_APP_URL` を本番ドメインに設定（例: `https://app.example.com`）
- [ ] ⚙️ デプロイ → 本番ドメインを設定
- [ ] ⚙️ Stripe / LINE の Webhook URL を本番ドメインに更新（手順3・4）

## 8. 法務・事業者情報（あなたの情報で確定）★必須
- [ ] `src/app/legal/privacy/page.tsx`：個人情報保護管理者（代表者名）・問い合わせ窓口
- [ ] `src/app/legal/terms/page.tsx`：管轄裁判所・事業者名
- [ ] `src/app/legal/tokushoho/page.tsx`：事業者名・代表者・所在地・連絡先 等（`____` を置換）
- [ ] 必要に応じて専門家レビュー

---

## 9. 動作確認（スモークテスト）
本番（または `npm run dev`）で以下を順に確認:
- [ ] サインアップ → 会社（テナント）と Owner が作成される
- [ ] 取引先（顧客）を登録（PDF送付先メールを設定）
- [ ] 現場を登録（緯度経度も入力）
- [ ] スタッフを招待（メール受信→参加→LINEユーザーID登録）
- [ ] 作業指示を作成し「LINE配信」→ スタッフのLINEに届く
- [ ] スタッフ端末で GPS到着確認（現場200m以内で到着記録）※Pro
- [ ] スタッフが現場報告 + 写真（最大5枚）を提出
- [ ] 管理者が報告を承認 → PDF生成 → 顧客へメール送付 ※Pro
- [ ] 課金: Starter/Pro を購入 → プラン反映 → Pro機能が解放
- [ ] 別テナントを作成し、互いのデータが見えない（RLS分離）ことを確認

---

## 10.（任意）元システムとの差分確認＝実機調査
本要件定義/実装は譲渡資料ベースの推定箇所があります（`docs/requirements` の «推定»）。
**あなたにしかできない作業**として、元システム（`trendlinks-app.vercel.app`）へ
提供済みの認証情報でログインし、以下を突合すると再現精度が上がります:
- [ ] 画面・項目名・遷移の差分
- [ ] DB項目（現場/作業指示/報告のフィールド）
- [ ] プランごとの機能差（Free/Starter での GPS・PDF 可否）

> 上記がすべて完了すれば、本番稼働＝完全再現の状態になります。
