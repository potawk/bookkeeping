"use client";

import { useActionState } from "react";
import { ButtonLink } from "@/components/ui/button-link";
import { FormAlert } from "@/components/ui/form-alert";
import { FormField } from "@/components/ui/form-field";
import { SelectField } from "@/components/ui/select-field";
import { SubmitButton } from "@/components/ui/submit-button";
import {
  ACCOUNT_CATEGORIES,
  type AccountCategory,
} from "@/lib/accounts/categories";
import { ACCOUNT_NAME_MAX_LENGTH } from "@/lib/accounts/validation";
import { initialFormState, type FormState } from "@/lib/form-state";

type AccountFormProps = {
  /** 作成（createAccount）または更新（updateAccount に勘定科目 ID を bind したもの） */
  action: (prevState: FormState, formData: FormData) => Promise<FormState>;
  defaultValues: { name: string; category: AccountCategory };
  /** true のとき区分を変更できない（仕訳・期首残高で使用中の勘定科目） */
  categoryLocked?: boolean;
  submitLabel: string;
  pendingLabel: string;
  cancelHref: string;
};

/** 勘定科目の作成・編集フォーム（科目名・区分） */
export function AccountForm({
  action,
  defaultValues,
  categoryLocked = false,
  submitLabel,
  pendingLabel,
  cancelHref,
}: AccountFormProps) {
  const [state, formAction, pending] = useActionState(action, initialFormState);

  return (
    // noValidate: ブラウザ標準のエラー表示ではなく、サーバー側の検証結果を日本語で表示する
    <form action={formAction} noValidate className="space-y-6">
      <FormAlert message={state.message} />
      <FormField
        name="name"
        label="科目名"
        type="text"
        required
        maxLength={ACCOUNT_NAME_MAX_LENGTH}
        hint={`${ACCOUNT_NAME_MAX_LENGTH}文字以内`}
        defaultValue={state.values?.name ?? defaultValues.name}
        error={state.fieldErrors.name}
      />
      {categoryLocked ? (
        <>
          {/* 区分を変更できない場合も、現在の区分を送信する */}
          <input type="hidden" name="category" value={defaultValues.category} />
          <SelectField
            name="category-display"
            label="区分"
            options={ACCOUNT_CATEGORIES}
            defaultValue={defaultValues.category}
            disabled
            hint="仕訳または期首残高で使用中のため、区分は変更できません。"
          />
        </>
      ) : (
        <SelectField
          name="category"
          label="区分"
          options={ACCOUNT_CATEGORIES}
          required
          defaultValue={state.values?.category ?? defaultValues.category}
          error={state.fieldErrors.category}
        />
      )}
      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <ButtonLink href={cancelHref} variant="secondary">
          キャンセル
        </ButtonLink>
        <SubmitButton pending={pending} pendingLabel={pendingLabel}>
          {submitLabel}
        </SubmitButton>
      </div>
    </form>
  );
}
