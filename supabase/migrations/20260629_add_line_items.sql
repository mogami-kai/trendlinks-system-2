-- quotes テーブルにアプリ内入力カラムを追加
alter table quotes
  add column if not exists line_items jsonb,
  add column if not exists notes text;

-- tenant_invoices テーブルにアプリ内入力カラムを追加
alter table tenant_invoices
  add column if not exists line_items jsonb,
  add column if not exists deposit_offset numeric,
  add column if not exists notes text;
