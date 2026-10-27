import "server-only";
import { listAccountsWithSubAccounts } from "@/lib/accounts/queries";
import { createClient } from "@/lib/supabase/server";
import {
  summarizeAccounts,
  sumAmounts,
  type AccountAmount,
  type BalanceEntry,
} from "./aggregate";

export type ProfitAndLoss = {
  revenues: AccountAmount[];
  expenses: AccountAmount[];
  revenueTotal: number;
  expenseTotal: number;
  /** 当期純損益＝収益合計－費用合計（マイナスは当期純損失） */
  netIncome: number;
};

export type BalanceSheet = {
  /** 期首日（YYYY-MM-DD）。期首残高が未登録なら null */
  openingDate: string | null;
  /** 基準日が期首日より前なら true（集計できない） */
  beforeOpeningDate: boolean;
  assets: AccountAmount[];
  liabilities: AccountAmount[];
  /** 純資産の勘定科目（元入金など）に仕訳で計上した分 */
  equities: AccountAmount[];
  /** 元入金（期首残高の資産合計－負債合計） */
  openingCapital: number;
  /** 利益剰余金（期首日から基準日までの収益合計－費用合計） */
  retainedEarnings: number;
  assetTotal: number;
  liabilityTotal: number;
  equityTotal: number;
};

/**
 * 期間内（両端を含む）の仕訳明細を、勘定科目・補助科目ごとの借方合計・貸方合計で取得する。
 * 集計はデータベース関数 get_journal_line_totals で行い、RLS により本人の仕訳だけが対象になる。
 * startDate が null なら endDate までのすべての仕訳を集計する。
 */
async function getJournalLineTotals(
  startDate: string | null,
  endDate: string,
): Promise<BalanceEntry[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_journal_line_totals", {
    // 生成される型は引数の null を表せないため、null はキャストして渡す
    p_start_date: startDate as string,
    p_end_date: endDate,
  });
  if (error) throw error;

  return data.map((row) => ({
    accountId: row.account_id,
    // 生成される型では null を表せないが、補助科目を指定していない明細は null になる
    subAccountId: (row.sub_account_id as string | null) ?? null,
    debit: row.debit_total,
    credit: row.credit_total,
  }));
}

/** 損益計算書（開始日〜終了日の収益・費用を勘定科目ごとに集計する） */
export async function getProfitAndLoss(
  startDate: string,
  endDate: string,
): Promise<ProfitAndLoss> {
  const [accounts, entries] = await Promise.all([
    listAccountsWithSubAccounts(),
    getJournalLineTotals(startDate, endDate),
  ]);

  const revenues = summarizeAccounts(accounts, entries, "revenue");
  const expenses = summarizeAccounts(accounts, entries, "expense");
  const revenueTotal = sumAmounts(revenues);
  const expenseTotal = sumAmounts(expenses);

  return {
    revenues,
    expenses,
    revenueTotal,
    expenseTotal,
    netIncome: revenueTotal - expenseTotal,
  };
}

/** 期首日と期首残高（資産は借方、負債は貸方の残高として扱う） */
async function getOpeningEntries(): Promise<{
  openingDate: string | null;
  entries: BalanceEntry[];
}> {
  const supabase = await createClient();
  const [profile, balances] = await Promise.all([
    supabase.from("profiles").select("opening_date").maybeSingle(),
    supabase
      .from("opening_balances")
      .select("account_id, sub_account_id, amount, accounts(category)"),
  ]);
  if (profile.error) throw profile.error;
  if (balances.error) throw balances.error;

  return {
    openingDate: profile.data?.opening_date ?? null,
    entries: balances.data.map((row) => {
      const isAsset = row.accounts.category === "asset";
      return {
        accountId: row.account_id,
        subAccountId: row.sub_account_id,
        debit: isAsset ? row.amount : 0,
        credit: isAsset ? 0 : row.amount,
      };
    }),
  };
}

/**
 * 貸借対照表（基準日時点）。requirements.md 4.5 のとおり、
 * 資産・負債の残高＝期首残高＋期首日から基準日までの仕訳の増減、
 * 純資産＝元入金＋純資産科目への仕訳＋利益剰余金で計算する。
 */
export async function getBalanceSheet(date: string): Promise<BalanceSheet> {
  const [accounts, opening] = await Promise.all([
    listAccountsWithSubAccounts(),
    getOpeningEntries(),
  ]);
  const { openingDate } = opening;
  const beforeOpeningDate = openingDate !== null && date < openingDate;

  // 期首日より前の仕訳は対象外（期首残高が未登録なら、基準日までのすべての仕訳を集計する）
  const journalEntries = beforeOpeningDate
    ? []
    : await getJournalLineTotals(openingDate, date);

  const openingAssets = sumAmounts(
    summarizeAccounts(accounts, opening.entries, "asset"),
  );
  const openingLiabilities = sumAmounts(
    summarizeAccounts(accounts, opening.entries, "liability"),
  );
  const openingCapital = beforeOpeningDate
    ? 0
    : openingAssets - openingLiabilities;

  const balanceEntries = beforeOpeningDate
    ? []
    : [...opening.entries, ...journalEntries];
  const assets = summarizeAccounts(accounts, balanceEntries, "asset");
  const liabilities = summarizeAccounts(accounts, balanceEntries, "liability");
  const equities = summarizeAccounts(accounts, journalEntries, "equity");
  const retainedEarnings =
    sumAmounts(summarizeAccounts(accounts, journalEntries, "revenue")) -
    sumAmounts(summarizeAccounts(accounts, journalEntries, "expense"));

  return {
    openingDate,
    beforeOpeningDate,
    assets,
    liabilities,
    equities,
    openingCapital,
    retainedEarnings,
    assetTotal: sumAmounts(assets),
    liabilityTotal: sumAmounts(liabilities),
    equityTotal: openingCapital + sumAmounts(equities) + retainedEarnings,
  };
}
