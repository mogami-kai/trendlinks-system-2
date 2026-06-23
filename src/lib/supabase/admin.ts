import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * service_role を用いた管理クライアント (RLS バイパス)。
 * Webhook・招待などサーバー専用処理でのみ使用し、必ずテナント検証を行うこと。
 * クライアントへ絶対に露出させない。
 */
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
