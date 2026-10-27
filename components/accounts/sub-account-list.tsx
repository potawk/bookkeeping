"use client";

import { useActionState, useState } from "react";
import { buttonClassName } from "@/components/ui/button-styles";
import { ConfirmDeleteDialog } from "@/components/ui/confirm-delete-dialog";
import { FormAlert } from "@/components/ui/form-alert";
import { FormField } from "@/components/ui/form-field";
import { SubmitButton } from "@/components/ui/submit-button";
import {
  createSubAccount,
  deleteSubAccount,
  updateSubAccount,
} from "@/lib/accounts/actions";
import type { SubAccountDetail } from "@/lib/accounts/queries";
import { ACCOUNT_NAME_MAX_LENGTH } from "@/lib/accounts/validation";
import { initialFormState } from "@/lib/form-state";

/** 補助科目の一覧（行ごとの編集・削除）と追加フォーム */
export function SubAccountList({
  accountId,
  subAccounts,
}: {
  accountId: string;
  subAccounts: SubAccountDetail[];
}) {
  return (
    <div className="space-y-6">
      {subAccounts.length === 0 ? (
        <p className="text-base leading-relaxed text-gray-700">
          補助科目はまだありません。
        </p>
      ) : (
        <ul className="divide-y divide-gray-200 rounded-xl border border-gray-300">
          {subAccounts.map((subAccount) => (
            <SubAccountRow key={subAccount.id} subAccount={subAccount} />
          ))}
        </ul>
      )}
      <AddSubAccountForm accountId={accountId} />
    </div>
  );
}

/** 補助科目の1行。「編集」で名前の入力欄に切り替わる */
function SubAccountRow({ subAccount }: { subAccount: SubAccountDetail }) {
  const [editing, setEditing] = useState(false);
  const [state, formAction, pending] = useActionState(
    async (prevState: typeof initialFormState, formData: FormData) => {
      const result = await updateSubAccount(subAccount.id, prevState, formData);
      if (result.ok) setEditing(false);
      return result;
    },
    initialFormState,
  );

  if (editing) {
    return (
      <li className="p-4">
        <form action={formAction} noValidate className="space-y-4">
          <FormAlert message={state.message} />
          <FormField
            id={`sub-account-${subAccount.id}`}
            name="name"
            label="補助科目名"
            type="text"
            required
            maxLength={ACCOUNT_NAME_MAX_LENGTH}
            defaultValue={state.values?.name ?? subAccount.name}
            error={state.fieldErrors.name}
            autoFocus
          />
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setEditing(false)}
              className={buttonClassName("secondary", "sm")}
            >
              キャンセル
            </button>
            <SubmitButton pending={pending} pendingLabel="保存中…" size="sm">
              保存
            </SubmitButton>
          </div>
        </form>
      </li>
    );
  }

  return (
    <li className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="space-y-1">
        <p className="text-base font-semibold text-gray-900">
          {subAccount.name}
        </p>
        {subAccount.inUse && (
          <p className="text-xs leading-normal text-gray-600">
            仕訳または期首残高で使用中のため削除できません
          </p>
        )}
      </div>
      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => setEditing(true)}
          className={buttonClassName("secondary", "sm")}
        >
          編集
        </button>
        {!subAccount.inUse && (
          <ConfirmDeleteDialog
            action={deleteSubAccount.bind(null, subAccount.id)}
            triggerLabel="削除"
            title="補助科目の削除"
            description={`補助科目「${subAccount.name}」を削除します。この操作は取り消せません。`}
          />
        )}
      </div>
    </li>
  );
}

/** 補助科目の追加フォーム（追加に成功すると入力欄が空に戻る） */
function AddSubAccountForm({ accountId }: { accountId: string }) {
  const [state, formAction, pending] = useActionState(
    createSubAccount.bind(null, accountId),
    initialFormState,
  );

  return (
    <form
      action={formAction}
      noValidate
      className="space-y-4 rounded-xl border border-gray-300 p-4"
    >
      <FormAlert message={state.message} />
      <FormField
        id="new-sub-account-name"
        name="name"
        label="補助科目を追加"
        type="text"
        required
        maxLength={ACCOUNT_NAME_MAX_LENGTH}
        placeholder="例：○○銀行"
        hint={`${ACCOUNT_NAME_MAX_LENGTH}文字以内`}
        defaultValue={state.ok ? "" : state.values?.name}
        error={state.fieldErrors.name}
      />
      <div className="flex justify-end">
        <SubmitButton pending={pending} pendingLabel="追加中…" size="sm">
          追加
        </SubmitButton>
      </div>
    </form>
  );
}
