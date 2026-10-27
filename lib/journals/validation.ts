import { isValidDate } from "@/lib/dates";
import { parseAmount } from "@/lib/format";
import type { EntrySide } from "./queries";

/** 仕訳フォームの入力値（借方1行・貸方1行） */
export type JournalFormValues = {
  entryDate: string;
  debitAccountId: string;
  debitSubAccountId: string;
  debitAmount: string;
  creditAccountId: string;
  creditSubAccountId: string;
  creditAmount: string;
  description: string;
};

/** 保存関数 save_journal に渡す仕訳明細の1行 */
export type JournalLineInput = {
  side: EntrySide;
  account_id: string;
  sub_account_id: string | null;
  amount: number;
};

export const DESCRIPTION_MAX_LENGTH = 200;

/** 金額の上限（1兆円未満）。桁あふれや入力ミスを防ぐ */
const MAX_AMOUNT = 999_999_999_999;

/** 金額を検証する。正しければ金額、誤りがあればエラーメッセージを返す */
function validateAmount(value: string): number | string {
  const amount = parseAmount(value);
  if (amount === null || amount < 1)
    return "金額は1以上の整数で入力してください。";
  if (amount > MAX_AMOUNT) return "金額が大きすぎます。";
  return amount;
}

/**
 * 仕訳の入力値を検証する。
 * - errors: 入力欄ごとのエラー（キーは JournalFormValues の項目名）
 * - balanceError: 借方と貸方の金額が一致しない場合のメッセージ
 * - lines: すべて正しい場合の仕訳明細（借方→貸方の順）
 */
export function validateJournal(values: JournalFormValues): {
  errors: Record<string, string>;
  balanceError?: string;
  lines: JournalLineInput[];
} {
  const errors: Record<string, string> = {};

  if (!isValidDate(values.entryDate)) {
    errors.entryDate = "日付を入力してください。";
  }
  if (!values.debitAccountId) {
    errors.debitAccountId = "借方の勘定科目を選択してください。";
  }
  if (!values.creditAccountId) {
    errors.creditAccountId = "貸方の勘定科目を選択してください。";
  }
  if (
    values.debitAccountId &&
    values.debitAccountId === values.creditAccountId &&
    values.debitSubAccountId === values.creditSubAccountId
  ) {
    errors.creditAccountId =
      "借方と貸方に同じ勘定科目・補助科目は指定できません。";
  }

  const debitAmount = validateAmount(values.debitAmount);
  const creditAmount = validateAmount(values.creditAmount);
  if (typeof debitAmount === "string") errors.debitAmount = debitAmount;
  if (typeof creditAmount === "string") errors.creditAmount = creditAmount;

  if (values.description.length > DESCRIPTION_MAX_LENGTH) {
    errors.description = `摘要は${DESCRIPTION_MAX_LENGTH}文字以内で入力してください。`;
  }

  if (
    Object.keys(errors).length > 0 ||
    typeof debitAmount === "string" ||
    typeof creditAmount === "string"
  ) {
    return { errors, lines: [] };
  }

  if (debitAmount !== creditAmount) {
    return {
      errors,
      balanceError: "借方と貸方の金額が一致していないため、保存できません。",
      lines: [],
    };
  }

  return {
    errors,
    lines: [
      {
        side: "debit",
        account_id: values.debitAccountId,
        sub_account_id: values.debitSubAccountId || null,
        amount: debitAmount,
      },
      {
        side: "credit",
        account_id: values.creditAccountId,
        sub_account_id: values.creditSubAccountId || null,
        amount: creditAmount,
      },
    ],
  };
}
