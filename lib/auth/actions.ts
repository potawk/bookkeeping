"use server";

import type { AuthError } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  validateSignIn,
  validateSignUp,
  type FieldErrors,
  type SignInInput,
  type SignUpInput,
} from "./validation";

/** フォームに返す結果。送信後も入力内容を残すため、パスワード以外の入力値を含める */
export type AuthFormState<T> = {
  values: Partial<Omit<T, "password" | "passwordConfirm">>;
  fieldErrors: FieldErrors<T>;
  message?: string;
};

/** FormData から文字列を取り出す（未入力・ファイルは空文字にする） */
function getString(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

/** Supabase Auth のエラーを、画面に表示する日本語のメッセージに変換する */
function toErrorMessage(error: AuthError): string {
  switch (error.code) {
    case "invalid_credentials":
      return "メールアドレスまたはパスワードが正しくありません。";
    case "user_already_exists":
    case "email_exists":
      return "このメールアドレスはすでに登録されています。";
    case "weak_password":
      return "パスワードが弱すぎます。別のパスワードを入力してください。";
    case "over_request_rate_limit":
    case "over_email_send_rate_limit":
      return "短時間に操作が集中しています。しばらく待ってから再度お試しください。";
    default:
      return "処理に失敗しました。時間をおいて再度お試しください。";
  }
}

/** ログイン */
export async function signIn(
  _prevState: AuthFormState<SignInInput>,
  formData: FormData,
): Promise<AuthFormState<SignInInput>> {
  const input: SignInInput = {
    email: getString(formData, "email"),
    // パスワードは前後の空白も含めてそのまま扱う
    password: String(formData.get("password") ?? ""),
  };
  const values = { email: input.email };

  const fieldErrors = validateSignIn(input);
  if (Object.keys(fieldErrors).length > 0) {
    return { values, fieldErrors };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(input);
  if (error) {
    return { values, fieldErrors: {}, message: toErrorMessage(error) };
  }

  redirect("/calendar");
}

/** 新規登録（登録後は期首残高入力画面へ移動する） */
export async function signUp(
  _prevState: AuthFormState<SignUpInput>,
  formData: FormData,
): Promise<AuthFormState<SignUpInput>> {
  const input: SignUpInput = {
    userName: getString(formData, "userName"),
    email: getString(formData, "email"),
    password: String(formData.get("password") ?? ""),
    passwordConfirm: String(formData.get("passwordConfirm") ?? ""),
  };
  const values = { userName: input.userName, email: input.email };

  const fieldErrors = validateSignUp(input);
  if (Object.keys(fieldErrors).length > 0) {
    return { values, fieldErrors };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email: input.email,
    password: input.password,
    // ユーザー名は auth.users の user_metadata に保存する
    options: { data: { user_name: input.userName } },
  });
  if (error) {
    return { values, fieldErrors: {}, message: toErrorMessage(error) };
  }

  redirect("/opening-balances");
}

/** ログアウト */
export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/signin");
}
