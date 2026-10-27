"use server";

import type { AuthError } from "@supabase/supabase-js";
import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { getFormString as getString, type FormState } from "@/lib/form-state";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "./user";
import {
  validateProfile,
  validateSignIn,
  validateSignUp,
  type FieldErrors,
  type ProfileInput,
  type SignInInput,
  type SignUpInput,
} from "./validation";

/** フォームに返す結果。送信後も入力内容を残すため、パスワード以外の入力値を含める */
export type AuthFormState<T> = {
  values: Partial<Omit<T, "password" | "passwordConfirm">>;
  fieldErrors: FieldErrors<T>;
  message?: string;
};

/** Supabase Auth のエラーを、画面に表示する日本語のメッセージに変換する */
function toErrorMessage(error: AuthError): string {
  switch (error.code) {
    case "invalid_credentials":
      return "メールアドレスまたはパスワードが正しくありません。";
    case "user_already_exists":
    case "email_exists":
      return "このメールアドレスはすでに登録されています。";
    case "email_address_invalid":
      // 送信できないアドレス（存在しないドメインなど）。メールアドレスの変更時は通知メールを送るため起こりうる
      return "このメールアドレスにはメールを送信できないため、変更できません。別のメールアドレスを入力してください。";
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

/**
 * マイページでユーザー名・メールアドレスを更新する。
 * ユーザー名は profiles と user_metadata の両方を更新する。メールアドレスは Supabase Auth で変更し、
 * 「Confirm email」がオフの設定のため確認メールなしですぐに切り替わる（次回から新しいアドレスでログインする）。
 */
export async function updateProfile(
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await getCurrentUser();
  const input: ProfileInput = {
    userName: getString(formData, "userName"),
    email: getString(formData, "email"),
  };
  const values = { ...input };

  const fieldErrors = validateProfile(input);
  if (Object.keys(fieldErrors).length > 0) {
    return { fieldErrors, values };
  }

  const emailChanged = input.email !== user.email;
  const supabase = await createClient();

  // 先に Auth を更新する（メールアドレスの重複などで失敗した場合は、ユーザー名も変えない）
  const { error: authError } = await supabase.auth.updateUser({
    ...(emailChanged && { email: input.email }),
    data: { user_name: input.userName },
  });
  if (authError) {
    return { fieldErrors: {}, values, message: toErrorMessage(authError) };
  }

  const { error: profileError } = await supabase
    .from("profiles")
    .update({ user_name: input.userName })
    .eq("id", user.id);
  if (profileError) {
    return {
      fieldErrors: {},
      values,
      message: "保存に失敗しました。時間をおいて再度お試しください。",
    };
  }

  refresh();
  return {
    fieldErrors: {},
    values,
    ok: true,
    message: emailChanged
      ? "ユーザー情報を保存しました。次回から新しいメールアドレスでログインしてください。"
      : "ユーザー情報を保存しました。",
  };
}

/** ログアウト */
export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/signin");
}
