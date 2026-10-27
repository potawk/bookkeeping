"use client";

import { useActionState } from "react";
import { FormAlert } from "@/components/ui/form-alert";
import { FormField } from "@/components/ui/form-field";
import { SubmitButton } from "@/components/ui/submit-button";
import { signIn, type AuthFormState } from "@/lib/auth/actions";
import type { SignInInput } from "@/lib/auth/validation";

const initialState: AuthFormState<SignInInput> = {
  values: {},
  fieldErrors: {},
};

/** ログインフォーム（入力値の検証とログイン処理はサーバー側の signIn で行う） */
export function SignInForm() {
  const [state, formAction, pending] = useActionState(signIn, initialState);

  return (
    // noValidate: ブラウザ標準のエラー表示ではなく、サーバー側の検証結果を日本語で表示する
    <form action={formAction} noValidate className="space-y-6">
      <FormAlert message={state.message} />
      <FormField
        name="email"
        label="メールアドレス"
        type="email"
        autoComplete="email"
        required
        defaultValue={state.values.email}
        error={state.fieldErrors.email}
      />
      <FormField
        name="password"
        label="パスワード"
        type="password"
        autoComplete="current-password"
        required
        error={state.fieldErrors.password}
      />
      <SubmitButton pending={pending} pendingLabel="ログイン中…" fullWidth>
        ログイン
      </SubmitButton>
    </form>
  );
}
