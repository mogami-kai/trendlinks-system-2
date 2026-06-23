# 06. API 設計

## 6.1 方針
- **CRUD は Supabase（PostgREST）自動 API** を `supabase-js` 経由で利用し、
  RLS でアクセス制御する（独自 API を最小化）。
- **副作用・外部連携・機密処理は Next.js Route Handlers / Server Actions** に集約
  （LINE 配信・GPS 判定・PDF 生成・Stripe・Webhook）。
- 認証は Supabase JWT。Route Handler ではセッション検証 + テナント検証を行う。

## 6.2 データ CRUD（PostgREST / supabase-js）

`supabase.from('<table>')` を用いた標準操作。RLS によりテナント分離。

| 対象 | 操作 | 備考 |
|---|---|---|
| sites | select/insert/update/delete | FR-1。上限チェックはサーバー Action 併用 |
| work_orders / work_order_assignees | select/insert/update/delete | FR-2。フィルタは `.eq/.gte/.lte` |
| reports / report_photos | select/insert/update | FR-4。写真は Storage + メタ行 |
| arrivals | select/insert | FR-5。距離計算後にサーバーが insert |
| customers | select/insert/update/delete | 顧客管理 |
| subscriptions | select | 参照のみ（更新は Webhook） |
| notification_logs | select | 参照のみ |

## 6.3 Route Handlers / Server Actions（独自エンドポイント）

| メソッド/パス | 機能 | 認証 | 対応 |
|---|---|---|---|
| `POST /api/work-orders/[id]/dispatch` | 作業指示を LINE 配信 | 要(Admin) | FR-3 |
| `POST /api/arrivals` | 位置を受け取り haversine 判定し記録 | 要(Staff) | FR-5 |
| `POST /api/reports/[id]/pdf` | 報告から PDF 生成・保存 | 要(Admin) | FR-6 |
| `POST /api/reports/[id]/pdf/send` | 生成 PDF を顧客へメール送付 | 要(Admin) | FR-6 |
| `POST /api/billing/checkout` | Stripe Checkout セッション作成 | 要(Owner) | `08` |
| `POST /api/billing/portal` | Stripe カスタマーポータル発行 | 要(Owner) | `08` |
| `POST /api/webhooks/stripe` | Stripe Webhook 受信（署名検証） | 公開(署名) | `08` |
| `POST /api/webhooks/line` | LINE Webhook（友だち追加/連携） | 公開(署名) | FR-3 |
| `POST /api/staff/invite` | スタッフ招待メール送信 | 要(Admin) | `07` |
| `POST /api/sites/geocode` | 住所→緯度経度（ジオコーディング） | 要(Admin) | FR-1 |

## 6.4 代表的な入出力

### `POST /api/arrivals`（FR-5）
要求:
```json
{ "work_order_id": "uuid", "lat": 35.0, "lng": 139.0 }
```
処理: 現場座標を取得 → haversine で距離計算 → 200m 以内なら `is_arrived=true`
→ `arrivals` に記録。
応答:
```json
{ "is_arrived": true, "distance_m": 42.5, "arrived_at": "..." }
```

### `POST /api/work-orders/[id]/dispatch`（FR-3）
処理: 対象スタッフの `line_user_id` を解決 → LINE Push 送信 →
`notification_logs` に結果記録。未連携はメール（Brevo）フォールバック。
応答: 配信結果サマリ（成功/失敗/スキップ件数）。

### `POST /api/reports/[id]/pdf`（FR-6）
処理: 報告 + 写真 + 現場 + テナント情報から HTML を生成 →
Puppeteer/Playwright で PDF 化 → `pdf-reports` バケットへ保存 → `pdf_reports` 行作成。
応答: `{ "pdf_report_id": "uuid", "url": "<署名URL>" }`

## 6.5 共通仕様
- 認証: `Authorization` ヘッダ or Cookie セッション。未認証は 401。
- 認可: 権限/テナント不一致は 403。
- バリデーション: zod 等でスキーマ検証。不正は 400。
- エラー形式: `{ "error": { "code": "...", "message": "..." } }`。
- レート制御: 配信・PDF など重い処理は簡易レート制御を検討。
- 冪等性: Webhook は重複イベントを冪等処理（イベント ID 記録）。
