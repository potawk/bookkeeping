import "server-only";
import type { AccountCategory } from "@/lib/accounts/categories";
import { createClient } from "@/lib/supabase/server";

/** 期首残高の入力で選べる勘定科目（資産・負債のみ）と、その補助科目 */
export type BalanceAccountOption = {
  id: string;
  name: string;
  category: Extract<AccountCategory, "asset" | "liability">;
  subAccounts: { id: string; name: string }[];
};

export type OpeningBalanceRow = {
  id: string;
  accountId: string;
  subAccountId: string | null;
  amount: number;
};

export type OpeningBalanceFormData = {
  /** 期首日（YYYY-MM-DD）。まだ登録していなければ null */
  openingDate: string | null;
  accounts: BalanceAccountOption[];
  rows: OpeningBalanceRow[];
};

export type OpeningBalanceSummary = {
  /** 期首日（YYYY-MM-DD）。まだ登録していなければ null */
  openingDate: string | null;
  assetTotal: number;
  liabilityTotal: number;
  /** 純資産（元入金）＝資産合計－負債合計 */
  capital: number;
};

/** 期首残高の概要（期首日と資産・負債・純資産の合計）を取得する（マイページで表示） */
export async function getOpeningBalanceSummary(
  userId: string,
): Promise<OpeningBalanceSummary> {
  const supabase = await createClient();

  const [profile, balances] = await Promise.all([
    supabase.from("profiles").select("opening_date").eq("id", userId).single(),
    supabase.from("opening_balances").select("amount, accounts(category)"),
  ]);

  if (profile.error) throw profile.error;
  if (balances.error) throw balances.error;

  let assetTotal = 0;
  let liabilityTotal = 0;
  for (const balance of balances.data) {
    if (balance.accounts.category === "asset") assetTotal += balance.amount;
    if (balance.accounts.category === "liability") {
      liabilityTotal += balance.amount;
    }
  }

  return {
    openingDate: profile.data.opening_date,
    assetTotal,
    liabilityTotal,
    capital: assetTotal - liabilityTotal,
  };
}

/** 期首残高入力画面に必要なデータ（期首日・選べる勘定科目・登録済みの期首残高）をまとめて取得する */
export async function getOpeningBalanceFormData(
  userId: string,
): Promise<OpeningBalanceFormData> {
  const supabase = await createClient();

  const [profile, accounts, rows] = await Promise.all([
    supabase.from("profiles").select("opening_date").eq("id", userId).single(),
    supabase
      .from("accounts")
      .select("id, name, category, sub_accounts(id, name, sort_order)")
      .in("category", ["asset", "liability"])
      .order("sort_order")
      .order("sort_order", { referencedTable: "sub_accounts" }),
    supabase
      .from("opening_balances")
      .select("id, account_id, sub_account_id, amount")
      .order("created_at"),
  ]);

  if (profile.error) throw profile.error;
  if (accounts.error) throw accounts.error;
  if (rows.error) throw rows.error;

  return {
    openingDate: profile.data.opening_date,
    accounts: accounts.data.map((account) => ({
      id: account.id,
      name: account.name,
      category: account.category as BalanceAccountOption["category"],
      subAccounts: account.sub_accounts.map((sub) => ({
        id: sub.id,
        name: sub.name,
      })),
    })),
    rows: rows.data.map((row) => ({
      id: row.id,
      accountId: row.account_id,
      subAccountId: row.sub_account_id,
      amount: row.amount,
    })),
  };
}
