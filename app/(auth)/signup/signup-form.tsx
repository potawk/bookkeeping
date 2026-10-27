"use client";

import { useActionState } from "react";
import { FormAlert } from "@/components/ui/form-alert";
import { FormField } from "@/components/ui/form-field";
import { SubmitButton } from "@/components/ui/submit-button";
import { signUp, type AuthFormState } from "@/lib/auth/actions";
import {
  PASSWORD_MIN_LENGTH,
  USER_NAME_MAX_LENGTH,
  type SignUpInput,
} from "@/lib/auth/validation";

const initialState: AuthFormState<SignUpInput> = {
  values: {},
  fieldErrors: {},
};

/** 新規登録フォーム（入力値の検証と登録処理はサーバー側の signUp で行う） */
export function SignUpForm() {
  const [state, formAction, pending] = useActionState(signUp, initialState);

  return (
    // noValidate: ブラウザ標準のエラー表示ではなく、サーバー側の検証結果を日本語で表示する
    <form action={formAction} noValidate className="space-y-6">
      <FormAlert message={state.message} />
      <FormField
        name="userName"
        label="ユーザー名"
        type="text"
        autoComplete="nickname"
        required
        maxLength={USER_NAME_MAX_LENGTH}
        hint={`${USER_NAME_MAX_LENGTH}文字以内`}
        defaultValue={state.values.userName}
        error={state.fieldErrors.userName}
      />
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
        autoComplete="new-password"
        required
        minLength={PASSWORD_MIN_LENGTH}
        hint={`半角英数字${PASSWORD_MIN_LENGTH}文字以上`}
        error={state.fieldErrors.password}
      />
      <FormField
        name="passwordConfirm"
        label="パスワード（確認）"
        type="password"
        autoComplete="new-password"
        required
        error={state.fieldErrors.passwordConfirm}
      />
      <SubmitButton pending={pending} pendingLabel="登録中…" fullWidth>
        新規登録
      </SubmitButton>
    </form>
  );
}
