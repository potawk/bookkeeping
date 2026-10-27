import type { EntrySide, Journal, JournalLine } from "./queries";

/** 仕訳明細の科目名（補助科目があれば「普通預金（A銀行）」の形式） */
export function formatLineAccount(line: JournalLine): string {
  return line.subAccountName
    ? `${line.accountName}（${line.subAccountName}）`
    : line.accountName;
}

/** 借方または貸方の明細 */
export function getSideLines(journal: Journal, side: EntrySide): JournalLine[] {
  return journal.lines.filter((line) => line.side === side);
}

/** 借方または貸方の科目名（複合仕訳の場合は「、」でつなぐ） */
export function formatSideAccounts(journal: Journal, side: EntrySide): string {
  return getSideLines(journal, side).map(formatLineAccount).join("、");
}

/** 仕訳の金額（借方合計。保存時に貸方合計と一致することを確認している） */
export function getJournalAmount(journal: Journal): number {
  return getSideLines(journal, "debit").reduce(
    (total, line) => total + line.amount,
    0,
  );
}
