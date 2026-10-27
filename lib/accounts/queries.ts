import "server-only";
import { createClient } from "@/lib/supabase/server";
import { isUuid } from "@/lib/uuid";
import type { AccountCategory } from "./categories";

export type AccountListItem = {
  id: string;
  name: string;
  subAccountCount: number;
};

export type SubAccountDetail = {
  id: string;
  name: string;
  /** 仕訳・期首残高で使用中なら true（削除できない） */
  inUse: boolean;
};

export type AccountDetail = {
  id: string;
  name: string;
  category: AccountCategory;
  /** 仕訳・期首残高で使用中なら true（削除・区分の変更ができない） */
  inUse: boolean;
  subAccounts: SubAccountDetail[];
};

/** 勘定科目と、その補助科目（仕訳フォームの選択肢・決算書の集計に使う） */
export type AccountWithSubAccounts = {
  id: string;
  name: string;
  category: AccountCategory;
  subAccounts: { id: string; name: string }[];
};

/** 全区分の勘定科目（区分順・表示順、補助科目つき）。RLS により本人の科目だけが返る */
export async function listAccountsWithSubAccounts(): Promise<
  AccountWithSubAccounts[]
> {
  const supabase = await createClient();
  // category は enum の定義順（資産・負債・純資産・収益・費用）で並ぶ
  const { data, error } = await supabase
    .from("accounts")
    .select("id, name, category, sub_accounts(id, name, sort_order)")
    .order("category")
    .order("sort_order")
    .order("name")
    .order("sort_order", { referencedTable: "sub_accounts" });

  if (error) throw error;

  return data.map((account) => ({
    id: account.id,
    name: account.name,
    category: account.category,
    subAccounts: account.sub_accounts.map((sub) => ({
      id: sub.id,
      name: sub.name,
    })),
  }));
}

/** 区分ごとの勘定科目一覧（補助科目の数つき）。RLS により本人の科目だけが返る */
export async function listAccounts(
  category: AccountCategory,
): Promise<AccountListItem[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("accounts")
    .select("id, name, sub_accounts(count)")
    .eq("category", category)
    .order("sort_order")
    .order("name");

  if (error) throw error;

  return data.map((account) => ({
    id: account.id,
    name: account.name,
    subAccountCount: account.sub_accounts[0]?.count ?? 0,
  }));
}

/** 仕訳明細・期首残高で使われている件数を数える（勘定科目または補助科目） */
async function countUsage(
  column: "account_id" | "sub_account_id",
  id: string,
): Promise<number> {
  const supabase = await createClient();
  const [lines, openingBalances] = await Promise.all([
    supabase
      .from("journal_lines")
      .select("id", { count: "exact", head: true })
      .eq(column, id),
    supabase
      .from("opening_balances")
      .select("id", { count: "exact", head: true })
      .eq(column, id),
  ]);
  if (lines.error) throw lines.error;
  if (openingBalances.error) throw openingBalances.error;
  return (lines.count ?? 0) + (openingBalances.count ?? 0);
}

/** 勘定科目の詳細（補助科目と使用状況つき）。見つからなければ null */
export async function getAccountDetail(
  id: string,
): Promise<AccountDetail | null> {
  if (!isUuid(id)) return null;

  const supabase = await createClient();
  const { data: account, error } = await supabase
    .from("accounts")
    .select("id, name, category, sub_accounts(id, name, sort_order)")
    .eq("id", id)
    .order("sort_order", { referencedTable: "sub_accounts" })
    .maybeSingle();

  if (error) throw error;
  if (!account) return null;

  const [accountUsage, subAccountUsages] = await Promise.all([
    countUsage("account_id", account.id),
    Promise.all(
      account.sub_accounts.map((sub) => countUsage("sub_account_id", sub.id)),
    ),
  ]);

  return {
    id: account.id,
    name: account.name,
    category: account.category,
    inUse: accountUsage > 0,
    subAccounts: account.sub_accounts.map((sub, index) => ({
      id: sub.id,
      name: sub.name,
      inUse: subAccountUsages[index] > 0,
    })),
  };
}
