import type { AccountWithSubAccounts } from "@/lib/accounts/queries";
import type { AccountCategory } from "@/lib/accounts/categories";

/** 勘定科目・補助科目ごとの借方合計・貸方合計（仕訳明細の集計結果や期首残高） */
export type BalanceEntry = {
  accountId: string;
  subAccountId: string | null;
  debit: number;
  credit: number;
};

export type SubAccountAmount = {
  /** 補助科目の ID（補助科目を指定していない分は null） */
  id: string | null;
  name: string;
  amount: number;
};

/** 決算書に表示する勘定科目1行分の金額 */
export type AccountAmount = {
  id: string;
  name: string;
  amount: number;
  /** 補助科目別の内訳（補助科目を使った明細がない科目は空） */
  subAccounts: SubAccountAmount[];
};

/** 補助科目を指定していない分の表示名 */
const NO_SUB_ACCOUNT_NAME = "補助科目なし";

/**
 * 区分に応じて残高（金額）を計算する（requirements.md 4.1）。
 * 資産・費用は借方で増えるので「借方－貸方」、負債・純資産・収益は貸方で増えるので「貸方－借方」。
 */
export function toCategoryAmount(
  category: AccountCategory,
  debit: number,
  credit: number,
): number {
  return category === "asset" || category === "expense"
    ? debit - credit
    : credit - debit;
}

/**
 * 指定した区分の勘定科目ごとに金額を集計する（勘定科目の表示順）。
 * 金額が 0 で内訳もすべて 0 の科目（使っていない科目）は除く。
 */
export function summarizeAccounts(
  accounts: AccountWithSubAccounts[],
  entries: BalanceEntry[],
  category: AccountCategory,
): AccountAmount[] {
  const results: AccountAmount[] = [];

  for (const account of accounts) {
    if (account.category !== category) continue;

    // 補助科目ごと（指定なしは null）の金額を合計する
    const amountBySub = new Map<string | null, number>();
    for (const entry of entries) {
      if (entry.accountId !== account.id) continue;
      amountBySub.set(
        entry.subAccountId,
        (amountBySub.get(entry.subAccountId) ?? 0) +
          toCategoryAmount(category, entry.debit, entry.credit),
      );
    }

    const amount = [...amountBySub.values()].reduce((sum, v) => sum + v, 0);
    const hasSubAccountEntries = [...amountBySub.keys()].some(
      (id) => id !== null,
    );
    const subAccounts: SubAccountAmount[] = hasSubAccountEntries
      ? [
          ...account.subAccounts.map((sub) => ({
            id: sub.id,
            name: sub.name,
            amount: amountBySub.get(sub.id) ?? 0,
          })),
          {
            id: null,
            name: NO_SUB_ACCOUNT_NAME,
            amount: amountBySub.get(null) ?? 0,
          },
        ].filter((sub) => sub.amount !== 0)
      : [];

    if (amount === 0 && subAccounts.length === 0) continue;
    results.push({ id: account.id, name: account.name, amount, subAccounts });
  }

  return results;
}

/** 勘定科目の金額の合計 */
export function sumAmounts(items: AccountAmount[]): number {
  return items.reduce((total, item) => total + item.amount, 0);
}
