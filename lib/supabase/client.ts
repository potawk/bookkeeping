import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/database.types";
import { getSupabaseEnv } from "./env";

/**
 * ブラウザ（Client Component）で使う Supabase クライアントを作成する。
 *
 * ログイン中のユーザーの権限で動くため、RLS により本人のデータだけを操作できる。
 */
export function createClient() {
  const { url, anonKey } = getSupabaseEnv();
  return createBrowserClient<Database>(url, anonKey);
}
