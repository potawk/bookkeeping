import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getSupabaseEnv } from "./env";

/**
 * サーバー（Server Component・Server Action・Route Handler）で使う Supabase クライアントを作成する。
 *
 * ログイン状態（セッション）は Cookie で受け渡すため、リクエストごとに新しく作成すること。
 * ログイン中のユーザーの権限で動くため、RLS により本人のデータだけを操作できる。
 */
export async function createClient() {
  const { url, anonKey } = getSupabaseEnv();
  const cookieStore = await cookies();

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // Server Component からは Cookie を書き込めないため例外になる。
          // セッションの更新は proxy.ts で行うので、ここでは無視してよい。
        }
      },
    },
  });
}
