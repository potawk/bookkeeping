"use client";

import { startTransition, useActionState, useState } from "react";
import { ButtonLink } from "@/components/ui/button-link";
import { FieldMessages } from "@/components/ui/field-messages";
import { fieldAriaProps, fieldClassName } from "@/components/ui/field-styles";
import { FormAlert } from "@/components/ui/form-alert";
import { FormField } from "@/components/ui/form-field";
import { SubmitButton } from "@/components/ui/submit-button";
import { ACCOUNT_CATEGORIES } from "@/lib/accounts/categories";
import { formatYen, parseAmount } from "@/lib/format";
import { initialFormState, type FormState } from "@/lib/form-state";
import type { EntrySide, JournalAccountOption } from "@/lib/journals/queries";
import {
  DESCRIPTION_MAX_LENGTH,
  type JournalFormValues,
} from "@/lib/journals/validation";

type JournalFormProps = {
  /** 登録（createJournal）または更新（updateJournal に仕訳 ID を bind したもの） */
  action: (prevState: FormState, formData: FormData) => Promise<FormState>;
  defaultValues: JournalFormValues;
  accounts: JournalAccountOption[];
  submitLabel: string;
  pendingLabel: string;
  cancelHref: string;
};

/** 借方・貸方の入力欄の見出しと説明 */
const SIDE_LABELS: Record<EntrySide, { label: string; hint: string }> = {
  debit: {
    label: "借方",
    hint: "増えた資産・発生した費用など（例：食費）",
  },
  credit: {
    label: "貸方",
    hint: "減った資産・増えた負債・発生した収益など（例：現金）",
  },
};

/**
 * 仕訳の登録・編集フォーム（日付・借方・貸方・摘要）。
 * - 勘定科目を選ぶと、その科目の補助科目だけを選べるようにする
 * - 貸方の金額を手で変えるまでは、借方の金額を貸方へ自動で反映する
 * - 借方と貸方の差額をその場で表示する（一致しない場合はサーバー側でも保存を拒否する）
 */
export function JournalForm({
  action,
  defaultValues,
  accounts,
  submitLabel,
  pendingLabel,
  cancelHref,
}: JournalFormProps) {
  const [values, setValues] = useState(defaultValues);
  // 貸方の金額を借方に連動させるか（貸方の金額を手で入力したら連動をやめる）
  const [creditLinked, setCreditLinked] = useState(
    defaultValues.creditAmount === defaultValues.debitAmount,
  );
  const [state, formAction, pending] = useActionState(action, initialFormState);

  const update = (changes: Partial<JournalFormValues>) =>
    setValues((current) => ({ ...current, ...changes }));

  const debitAmount = parseAmount(values.debitAmount);
  const creditAmount = parseAmount(values.creditAmount);
  const difference =
    debitAmount !== null && creditAmount !== null
      ? debitAmount - creditAmount
      : null;

  return (
    // noValidate: ブラウザ標準のエラー表示ではなく、サーバー側の検証結果を日本語で表示する
    // <form action> で送信すると、成功後に React がフォームを初期状態に戻し、
    // state で管理しているセレクトの表示がずれるため、onSubmit から Server Action を呼ぶ
    <form
      onSubmit={(event) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        startTransition(() => formAction(formData));
      }}
      noValidate
      className="space-y-6"
    >
      <FormAlert message={state.message} />

      <div className="max-w-xs">
        <FormField
          name="entryDate"
          label="日付"
          type="date"
          required
          value={values.entryDate}
          onChange={(event) => update({ entryDate: event.target.value })}
          error={state.fieldErrors.entryDate}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <EntrySideFields
          side="debit"
          accounts={accounts}
          accountId={values.debitAccountId}
          subAccountId={values.debitSubAccountId}
          amount={values.debitAmount}
          errors={state.fieldErrors}
          onChangeAccount={(accountId) =>
            // 勘定科目を変えたら、補助科目の選択は解除する
            update({ debitAccountId: accountId, debitSubAccountId: "" })
          }
          onChangeSubAccount={(subAccountId) =>
            update({ debitSubAccountId: subAccountId })
          }
          onChangeAmount={(amount) =>
            update(
              creditLinked
                ? { debitAmount: amount, creditAmount: amount }
                : { debitAmount: amount },
            )
          }
        />
        <EntrySideFields
          side="credit"
          accounts={accounts}
          accountId={values.creditAccountId}
          subAccountId={values.creditSubAccountId}
          amount={values.creditAmount}
          errors={state.fieldErrors}
          onChangeAccount={(accountId) =>
            update({ creditAccountId: accountId, creditSubAccountId: "" })
          }
          onChangeSubAccount={(subAccountId) =>
            update({ creditSubAccountId: subAccountId })
          }
          onChangeAmount={(amount) => {
            setCreditLinked(false);
            update({ creditAmount: amount });
          }}
        />
      </div>

      <BalanceDifference difference={difference} />

      <FormField
        name="description"
        label="摘要（任意）"
        type="text"
        maxLength={DESCRIPTION_MAX_LENGTH}
        placeholder="例：スーパーで食料品"
        hint={`${DESCRIPTION_MAX_LENGTH}文字以内`}
        value={values.description}
        onChange={(event) => update({ description: event.target.value })}
        error={state.fieldErrors.description}
      />

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

type EntrySideFieldsProps = {
  side: EntrySide;
  accounts: JournalAccountOption[];
  accountId: string;
  subAccountId: string;
  amount: string;
  errors: Record<string, string>;
  onChangeAccount: (accountId: string) => void;
  onChangeSubAccount: (subAccountId: string) => void;
  onChangeAmount: (amount: string) => void;
};

/** 借方または貸方の入力欄（勘定科目・補助科目・金額） */
function EntrySideFields({
  side,
  accounts,
  accountId,
  subAccountId,
  amount,
  errors,
  onChangeAccount,
  onChangeSubAccount,
  onChangeAmount,
}: EntrySideFieldsProps) {
  const { label, hint } = SIDE_LABELS[side];
  const account = accounts.find((item) => item.id === accountId);
  const hasSubAccounts = Boolean(account && account.subAccounts.length > 0);

  const accountName = `${side}AccountId`;
  const subAccountName = `${side}SubAccountId`;
  const amountName = `${side}Amount`;
  const accountError = errors[accountName];
  const amountError = errors[amountName];
  const accountAria = fieldAriaProps(accountName, undefined, accountError);
  const amountAria = fieldAriaProps(amountName, undefined, amountError);

  return (
    <fieldset className="space-y-4 rounded-2xl border border-gray-300 bg-white p-5 shadow-md">
      <legend className="sr-only">{label}</legend>
      <div aria-hidden="true" className="space-y-1">
        <p className="text-xl font-semibold leading-snug text-gray-900">
          {label}
        </p>
        <p className="text-xs leading-normal text-gray-600">{hint}</p>
      </div>

      <div className="space-y-2">
        <label
          htmlFor={accountName}
          className="block text-sm font-semibold text-gray-900"
        >
          勘定科目
        </label>
        <select
          id={accountName}
          name={accountName}
          value={accountId}
          onChange={(event) => onChangeAccount(event.target.value)}
          className={fieldClassName(Boolean(accountError))}
          aria-invalid={accountAria["aria-invalid"]}
          aria-describedby={accountAria["aria-describedby"]}
        >
          <option value="">勘定科目を選択</option>
          {/* 区分ごとにまとめて表示する */}
          {ACCOUNT_CATEGORIES.map((category) => {
            const options = accounts.filter(
              (item) => item.category === category.value,
            );
            if (options.length === 0) return null;
            return (
              <optgroup key={category.value} label={category.label}>
                {options.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </optgroup>
            );
          })}
        </select>
        <FieldMessages error={accountError} errorId={accountAria.errorId} />
      </div>

      <div className="space-y-2">
        <label
          htmlFor={subAccountName}
          className="block text-sm font-semibold text-gray-900"
        >
          補助科目（任意）
        </label>
        <select
          id={subAccountName}
          name={subAccountName}
          value={subAccountId}
          disabled={!hasSubAccounts}
          onChange={(event) => onChangeSubAccount(event.target.value)}
          className={fieldClassName(false)}
        >
          <option value="">
            {hasSubAccounts ? "補助科目なし" : "補助科目なし（未登録）"}
          </option>
          {account?.subAccounts.map((sub) => (
            <option key={sub.id} value={sub.id}>
              {sub.name}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <label
          htmlFor={amountName}
          className="block text-sm font-semibold text-gray-900"
        >
          金額
        </label>
        <div className="relative">
          <input
            id={amountName}
            name={amountName}
            type="text"
            inputMode="numeric"
            autoComplete="off"
            placeholder="0"
            value={amount}
            onChange={(event) => onChangeAmount(event.target.value)}
            className={`${fieldClassName(Boolean(amountError))} pr-10 text-right`}
            aria-invalid={amountAria["aria-invalid"]}
            aria-describedby={amountAria["aria-describedby"]}
          />
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-sm text-gray-600"
          >
            円
          </span>
        </div>
        <FieldMessages error={amountError} errorId={amountAria.errorId} />
      </div>
    </fieldset>
  );
}

/** 借方と貸方の差額の表示（色だけに頼らず、文言でも一致・不一致を伝える） */
function BalanceDifference({ difference }: { difference: number | null }) {
  if (difference === null) {
    return (
      <p
        aria-live="polite"
        className="rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm leading-relaxed text-gray-700"
      >
        借方と貸方の金額を入力すると、差額を表示します。
      </p>
    );
  }

  const balanced = difference === 0;
  return (
    <p
      aria-live="polite"
      className={`rounded-lg border bg-white px-4 py-3 text-sm font-semibold leading-relaxed ${
        balanced
          ? "border-green-600 text-green-700"
          : "border-red-600 text-red-600"
      }`}
    >
      {balanced
        ? "✓ 借方と貸方の金額が一致しています。"
        : `貸借差額 ${formatYen(Math.abs(difference))}（${
            difference > 0 ? "借方" : "貸方"
          }が多い）。一致しないと保存できません。`}
    </p>
  );
}
