import { parseAmount } from "@/lib/format";

/** 画面から送られてくる期首残高の1行（行を識別する key と入力値） */
export type OpeningBalanceInputRow = {
  key: string;
  accountId: string;
  subAccountId: string;
  amount: string;
};

export type ValidOpeningBalanceRow = {
  account_id: string;
  sub_account_id: string | null;
  amount: number;
};

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

/** 金額の上限（1兆円未満）。桁あふれや入力ミスを防ぐ */
const MAX_AMOUNT = 999_999_999_999;

/**
 * 期首日と期首残高の行を検証する。
 * エラーは期首日が "openingDate"、行は "row-<key>" をキーにして返す。
 */
export function validateOpeningBalances(
  openingDate: string,
  rows: OpeningBalanceInputRow[],
): { errors: Record<string, string>; validRows: ValidOpeningBalanceRow[] } {
  const errors: Record<string, string> = {};
  const validRows: ValidOpeningBalanceRow[] = [];
  const seen = new Set<string>();

  if (!DATE_REGEX.test(openingDate) || Number.isNaN(Date.parse(openingDate))) {
    errors.openingDate = "期首日を入力してください。";
  }

  for (const row of rows) {
    const errorKey = `row-${row.key}`;
    const amount = parseAmount(row.amount);

    if (!row.accountId) {
      errors[errorKey] = "勘定科目を選択してください。";
    } else if (amount === null) {
      errors[errorKey] = "金額は0以上の整数で入力してください。";
    } else if (amount > MAX_AMOUNT) {
      errors[errorKey] = "金額が大きすぎます。";
    } else {
      // 同じ勘定科目・補助科目の組み合わせは1行だけ
      const pairKey = `${row.accountId}:${row.subAccountId}`;
      if (seen.has(pairKey)) {
        errors[errorKey] = "同じ勘定科目・補助科目の行がすでにあります。";
      } else {
        seen.add(pairKey);
        validRows.push({
          account_id: row.accountId,
          sub_account_id: row.subAccountId || null,
          amount,
        });
      }
    }
  }

  return { errors, validRows };
}
