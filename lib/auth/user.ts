import "server-only";
import { redirect } from "next/navigation";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

/** 画面で使うログインユーザーの情報（必要な項目だけに絞る） */
export type CurrentUser = {
  id: string;
  email: string;
  userName: string;
  /** 登録日時（ISO 8601 形式） */
  createdAt: string;
  /** 最終ログイン日時（ISO 8601 形式） */
  lastSignInAt: string | null;
};

/**
 * ログインユーザーの情報を取得する。未ログインならログイン画面へリダイレクトする。
 *
 * - getUser() でトークンを Supabase Auth のサーバーに問い合わせて検証する（getSession() は使わない）
 * - 内部で cookies() を読むため、呼び出すコンポーネントは <Suspense> の内側に置くこと
 * - React の cache により、同じリクエスト内で何度呼んでも問い合わせは1回になる
 */
export const getCurrentUser = cache(async (): Promise<CurrentUser> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/signin");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("user_name")
    .eq("id", user.id)
    .single();

  return {
    id: user.id,
    email: user.email ?? "",
    userName: profile?.user_name ?? "",
    createdAt: user.created_at,
    lastSignInAt: user.last_sign_in_at ?? null,
  };
});
