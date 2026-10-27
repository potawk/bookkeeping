"use client";

import { useActionState } from "react";
import { FormAlert } from "@/components/ui/form-alert";
import { FormField } from "@/components/ui/form-field";
import { SubmitButton } from "@/components/ui/submit-button";
import { updateProfile } from "@/lib/auth/actions";
import { USER_NAME_MAX_LENGTH } from "@/lib/auth/validation";
import { initialFormState } from "@/lib/form-state";

type ProfileFormProps = {
  defaultValues: { userName: string; email: string };
};

/** マイページのユーザー情報編集フォーム（ユーザー名・メールアドレス） */
export function ProfileForm({ defaultValues }: ProfileFormProps) {
  const [state, formAction, pending] = useActionState(
    updateProfile,
    initialFormState,
  );

  return (
    // noValidate: ブラウザ標準のエラー表示ではなく、サーバー側の検証結果を日本語で表示する
    <form action={formAction} noValidate className="space-y-6">
      <FormAlert
        message={state.message}
        variant={state.ok ? "success" : "error"}
      />
      <FormField
        name="userName"
        label="ユーザー名"
        type="text"
        required
        autoComplete="nickname"
        maxLength={USER_NAME_MAX_LENGTH}
        hint={`${USER_NAME_MAX_LENGTH}文字以内`}
        defaultValue={state.values?.userName ?? defaultValues.userName}
        error={state.fieldErrors.userName}
      />
      <FormField
        name="email"
        label="メールアドレス"
        type="email"
        required
        autoComplete="email"
        hint="変更すると、次回から新しいメールアドレスでログインします"
        defaultValue={state.values?.email ?? defaultValues.email}
        error={state.fieldErrors.email}
      />
      <div className="flex justify-end">
        <SubmitButton pending={pending} pendingLabel="保存中…">
          保存
        </SubmitButton>
      </div>
    </form>
  );
}
