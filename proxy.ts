import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseEnv } from "@/lib/supabase/env";

/** ログインしていなくても開けるページ（ログイン済みならホームへ移動させる） */
const GUEST_ONLY_PATHS = ["/", "/signin", "/signup"];

/** ログイン後のホーム画面 */
const HOME_PATH = "/calendar";

/**
 * すべてのページ表示の前に実行され、次の2つを行う。
 * - Supabase のセッション（アクセストークン）を更新し、Cookie に書き戻す
 * - ログイン状態に応じて、ログイン画面またはホーム画面へリダイレクトする
 */
export async function proxy(request: NextRequest) {
  const { url, anonKey } = getSupabaseEnv();
  let response = NextResponse.next({ request });

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        // 更新後のセッションを、後続の処理（リクエスト）とブラウザ（レスポンス）の両方に渡す
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value),
        );
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
        // セッションを含むレスポンスが CDN などにキャッシュされないようにする
        Object.entries(headers).forEach(([key, value]) =>
          response.headers.set(key, value),
        );
      },
    },
  });

  // getUser() はトークンを Supabase Auth のサーバーで検証し、必要ならセッションを更新する。
  // この呼び出しと createServerClient の間に別の処理を挟まないこと。
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const isGuestOnlyPath = GUEST_ONLY_PATHS.includes(pathname);

  if (!user && !isGuestOnlyPath) {
    return redirectWithCookies(request, response, "/signin");
  }
  if (user && isGuestOnlyPath) {
    return redirectWithCookies(request, response, HOME_PATH);
  }

  return response;
}

/**
 * リダイレクトする際も、更新されたセッションの Cookie を引き継ぐ。
 * 引き継がないとセッションが失われ、意図せずログアウトされることがある。
 */
function redirectWithCookies(
  request: NextRequest,
  response: NextResponse,
  pathname: string,
) {
  const redirectResponse = NextResponse.redirect(
    new URL(pathname, request.url),
  );
  response.cookies
    .getAll()
    .forEach((cookie) => redirectResponse.cookies.set(cookie));
  return redirectResponse;
}

export const config = {
  // 静的ファイル・画像最適化・画像ファイルには適用しない
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
