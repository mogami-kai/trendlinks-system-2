# 09. 通知・PDF 連携

## 9.1 LINE Messaging API（作業指示配信 / FR-3）

### 用途
作業指示をスタッフへ Push 配信し、電話・メールの手間を削減する。

### 仕様
- 送信は Vercel Route Handler（`/api/work-orders/[id]/dispatch`）からサーバー側実行。
- スタッフは LINE 公式アカウントを友だち追加し、アプリ側で `line_user_id` を紐付け
  （`/api/webhooks/line` で友だち追加イベント処理、または連携コードで紐付け）。
- メッセージ: 現場名・住所・作業日・作業内容・アプリ詳細リンク（Flex Message 可）。
- 配信結果を `notification_logs` に記録（success/failed/skipped）。
- **無料枠 月 200 通**を考慮し、超過/失敗を検知してフォールバック（メール）。

### 環境変数
| 変数 | 用途 |
|---|---|
| `LINE_CHANNEL_ACCESS_TOKEN` | Push 送信 |
| `LINE_CHANNEL_SECRET` | Webhook 署名検証 |

## 9.2 Brevo SMTP（メール送信）

### 用途
- 認証メール（確認・招待・パスワードリセット）の送信元（Supabase のカスタム SMTP）。
- 顧客への PDF 報告書送付（FR-6）。
- LINE 未連携スタッフへの通知フォールバック（FR-3）。

### 仕様
- Supabase Auth の SMTP 設定に Brevo を登録（差出人ドメイン認証 SPF/DKIM 推奨）。
- アプリ発のメール（PDF 送付等）は Route Handler から Brevo API/SMTP で送信。
- **無料枠 300 通/日**を考慮し送信制御・ログ記録。

### 環境変数
| 変数 | 用途 |
|---|---|
| `BREVO_SMTP_HOST` / `BREVO_SMTP_USER` / `BREVO_SMTP_PASS` | SMTP 送信 |
| `BREVO_API_KEY` | API 送信（任意） |
| `MAIL_FROM` | 差出人アドレス |

## 9.3 顧客報告書 PDF 自動生成（FR-6）

### 要件
報告（写真・担当・コメント・現場情報）を 1 クリックで高品質 PDF 化し、顧客へ送付。

### 生成方式の比較

| 方式 | 概要 | 長所 | 短所 | 採否 |
|---|---|---|---|---|
| **Puppeteer/Playwright（HTML→PDF）** | HTML/CSS テンプレートを Headless Chrome で PDF 化 | デザイン自由度高・CSS 流用・写真レイアウト容易 | バイナリ重め（Vercel は `@sparticuz/chromium` 等で対応） | **推奨** |
| `@react-pdf/renderer` | React で PDF を宣言的に構築 | サーバーレスと相性良・軽量 | 複雑レイアウト/CSS 制約 | 代替 |
| WeasyPrint（Python） | 資料記載の方式 | 高品質 | Python 別ランタイム必要（本構成と不一致） | 不採用（参考） |

> 推奨は Puppeteer/Playwright。Vercel の制約に応じ `@react-pdf/renderer` を代替採用可。

### フロー
1. `/api/reports/[id]/pdf` で報告 + 関連データ取得 → HTML テンプレート生成。
2. PDF 化 → `pdf-reports` バケットへ保存 → `pdf_reports` 行作成。
3. `/api/reports/[id]/pdf/send` で Brevo により顧客（`customers.email`）へ送付、
   `pdf_reports.sent_at` と `notification_logs` を更新。

### PDF レイアウト要件（再掲・`02` FR-6）
会社名/ロゴ・発行日・現場情報・担当・完了コメント・作業写真・到着情報・会社情報。

## 9.4 通知の冪等性・信頼性
- すべての外部送信は結果を `notification_logs` に記録。
- 失敗時はリトライ方針を定義（即時 1 回 + 手動再送）。
- Webhook（LINE/Stripe）は署名検証 + イベント ID による冪等処理。
