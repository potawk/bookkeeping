/**
 * Supabase への接続に使う環境変数を読み込む。
 *
 * NEXT_PUBLIC_ 付きの環境変数はビルド時にブラウザ向けのコードへ埋め込まれるため、
 * `process.env.NEXT_PUBLIC_...` と直接書いて参照する（変数名を動的に組み立てると埋め込まれない）。
 */
export function getSupabaseEnv(): { url: string; anonKey: string } {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL と NEXT_PUBLIC_SUPABASE_ANON_KEY を .env.local に設定してください。",
    );
  }

  return { url, anonKey };
}
